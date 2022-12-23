#include <OneWire.h>
#include <DallasTemperature.h>
#include <Wire.h>
#include "MAX30105.h" //sparkfun MAX3010X library

MAX30105 particleSensor;

const int oneWireBus = 15; //pin sensor suhu
OneWire oneWire(oneWireBus);
DallasTemperature sensors(&oneWire);
const int gsr_grove = 34; //pin sensor gsr

void setup()
{
  Serial.begin(115200);
  sensors.begin();

  // Initialize sensor
  if (!particleSensor.begin(Wire, 0x57)) //Use default I2C port, 400kHz speed
  {
    Serial.println("MAX30102 was not found. Please check wiring/power/solder jumper at MH-ET LIVE MAX30102 board. ");
    while (1);
  }

  setup_max30102();

}
void setup_max30102() {

  //Setup to sense a nice looking saw tooth on the plotter
  byte ledBrightness = 0x7F; //Options: 0=Off to 255=50mA
  byte sampleAverage = 4; //Options: 1, 2, 4, 8, 16, 32
  byte ledMode = 2; //Options: 1 = Red only, 2 = Red + IR, 3 = Red + IR + Green
  //Options: 1 = IR only, 2 = Red + IR on MH-ET LIVE MAX30102 board
  int sampleRate = 200; //Options: 50, 100, 200, 400, 800, 1000, 1600, 3200
  int pulseWidth = 411; //Options: 69, 118, 215, 411
  int adcRange = 16384; //Options: 2048, 4096, 8192, 16384
  // Set up the wanted parameters
  particleSensor.setup(ledBrightness, sampleAverage, ledMode, sampleRate, pulseWidth, adcRange); //Configure sensor with these settings

}

unsigned long previousMillis = 0;        // will store last time data was updated
const long interval = 1000;           // interval at which to read all data (milliseconds)

double aveRed = 0;//DC component of RED signal
double aveIr = 0;//DC component of IR signal
double sumIrRMS = 0; //sum of IR square
double sumRedRMS = 0; // sum of RED square
unsigned int i = 0; //loop counter
#define SUM_CYCLE 100
int Num = SUM_CYCLE ; //calculate SpO2 by this sampling interval
double eSpO2 = 95.0;//initial value of estimated SpO2
double fSpO2 = 0.7; //filter factor for estimated SpO2
double fRate = 0.95; //low pass filter for IR/red LED value to eliminate AC component

#define TIMETOBOOT 3000 // wait for this time(msec) to output SpO2
#define SCALE 88.0 //adjust to display heart beat and SpO2 in Arduino serial plotter at the same time
#define SAMPLING 1 //if you want to see heart beat more precisely , set SAMPLING to 1
#define FINGER_ON 50000 // if ir signal is lower than this , it indicates your finger is not on the sensor
#define MINIMUM_SPO2 80.0
#define MAX_SPO2 100.0
#define MIN_SPO2 80.0

// Heart Rate Monitor by interval of zero crossing at falling edge
// max 180bpm - min 45bpm
#define FINGER_ON 50000 // if ir signal is lower than this , it indicates your finger is not on the sensor
#define LED_PERIOD 100 // light up LED for this period in msec when zero crossing is found for filtered IR signal
#define MAX_BPS 180
#define MIN_BPS 45

double HRM_estimator( double fir , double aveIr)
{
  static double fbpmrate = 0.95; // low pass filter coefficient for HRM in bpm
  static uint32_t crosstime = 0; //falling edge , zero crossing time in msec
  static uint32_t crosstime_prev = 0;//previous falling edge , zero crossing time in msec
  static double bpm = 60.0;
  static double ebpm = 60.0;
  static double eir = 0.0; //estimated lowpass filtered IR signal to find falling edge without notch
  static double firrate = 0.85; //IR filter coefficient to remove notch , should be smaller than fRate
  static double eir_prev = 0.0;

  // Heart Rate Monitor by finding falling edge
  eir = eir * firrate + fir * (1.0 - firrate); //estimated IR : low pass filtered IR signal
  if ( ((eir - aveIr) * (eir_prev - aveIr) < 0 ) && ((eir - aveIr) < 0.0)) { //find zero cross at falling edge
    crosstime = millis();//system time in msec of falling edge
    //Serial.print(crosstime); Serial.print(","); Serial.println(crosstime_prev);
    if ( ((crosstime - crosstime_prev ) > (60 * 1000 / MAX_BPS)) && ((crosstime - crosstime_prev ) < (60 * 1000 / MIN_BPS)) ) {
      bpm = 60.0 * 1000.0 / (double)(crosstime - crosstime_prev) ; //get bpm
      //Serial.println("crossed");
      ebpm = ebpm * fbpmrate + (1.0 - fbpmrate) * bpm;//estimated bpm by low pass filtered
    } else {
      //Serial.println("faild to find falling edge");
    }
    crosstime_prev = crosstime;
  }
  eir_prev = eir;
  //Serial.println(ebpm);
  return (ebpm);
}

void loop() {
  uint32_t ir, red ;//raw data
  double fred, fir; //floating point RED ana IR raw values
  double SpO2 = 0; //raw SpO2 before low pass filtered
  double Ebpm;//estimated Heart Rate (bpm)
  particleSensor.check(); //Check the sensor, read up to 3 samples
  while (particleSensor.available()) {//do we have new data
    red = particleSensor.getFIFOIR(); //why getFOFOIR output Red data by MAX30102 on MH-ET LIVE breakout board
    ir = particleSensor.getFIFORed(); //why getFIFORed output IR data by MAX30102 on MH-ET LIVE breakout board
    i++;
    fred = (double)red;
    fir = (double)ir;

    aveRed = aveRed * fRate + (double)red * (1.0 - fRate);//average red level by low pass filter
    aveIr = aveIr * fRate + (double)ir * (1.0 - fRate); //average IR level by low pass filter
    sumRedRMS += (fred - aveRed) * (fred - aveRed); //square sum of alternate component of red level
    sumIrRMS += (fir - aveIr) * (fir - aveIr);//square sum of alternate component of IR level

    Ebpm = HRM_estimator(fir, aveIr); //Ebpm is estimated BPM

    if ((i % SAMPLING) == 0) {//slow down graph plotting speed for arduino Serial plotter by decimation
      if ( millis() > TIMETOBOOT) {
        float ir_forGraph = (2.0 * fir - aveIr) / aveIr * SCALE;
        float red_forGraph = (2.0 * fred - aveRed) / aveRed * SCALE;
        //trancation to avoid Serial plotter's autoscaling
        if ( ir_forGraph > MAX_SPO2) ir_forGraph = MAX_SPO2;
        if ( ir_forGraph < MIN_SPO2) ir_forGraph = MIN_SPO2;
        if ( red_forGraph > MAX_SPO2 ) red_forGraph = MAX_SPO2;
        if ( red_forGraph < MIN_SPO2 ) red_forGraph = MIN_SPO2;
        if ( ir < FINGER_ON) eSpO2 = MINIMUM_SPO2; //indicator for finger detached
      }
    }
    if ((i % Num) == 0) {
      double R = (sqrt(sumRedRMS) / aveRed) / (sqrt(sumIrRMS) / aveIr);
      SpO2 = -23.3 * (R - 0.4) + 100 - 0 ;
      if (SpO2 > 100.0 ) SpO2 = 100.0;
      eSpO2 = fSpO2 * eSpO2 + (1.0 - fSpO2) * SpO2;//low pass filter
      sumRedRMS = 0.0; sumIrRMS = 0.0; i = 0;//reset mean square at every interval
      break;
    }
    particleSensor.nextSample(); //We're finished with this sample so move to next sample
    //Serial.println(SpO2);
  }

  unsigned long currentMillis = millis();
  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;

    int gsr = analogRead(gsr_grove);
    sensors.requestTemperatures();
    float temperatureC = sensors.getTempCByIndex(0);

    //Serial.print("SUHU = "); Serial.print(temperatureC); Serial.print("ºC");
    //Serial.print(", HR =  "); Serial.print(Ebpm); Serial.print(" BPM"); // estimated Heart Rate Monitor in bpm
    //Serial.print(", SPO2 = "); Serial.print(eSpO2); Serial.print(" %"); //low pass filtered SpO2
    //Serial.print(", GSR = "); Serial.print(gsr); Serial.println("");
    String dataToSend = String(temperatureC) + "," + String(Ebpm) + "," + String(eSpO2);// + "," + String(gsr);
    Serial.println(dataToSend);
  }
}
