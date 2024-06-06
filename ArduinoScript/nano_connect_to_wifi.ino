#include <WiFiNINA.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <Adafruit_BMP085.h>
#include <Adafruit_AHT10.h>

//WiFi, server topic and server ip address setup
const char* ssid = "iolab_lights";
const char* password = "let-there-be-light";
const char* mqtt_server = "192.168.128.102";
const char* topic = "arduino/data";

WiFiClient wifiClient;
PubSubClient client(wifiClient);

Adafruit_BMP085 bmp;
Adafruit_AHT10 aht;

void setup() {

Serial.begin(9600);

  if (!connectToWiFi()) {
    return;
  }

  client.setServer(mqtt_server, 1883);

  if (!checkBMP180()) {
    sendErrorMessage("Could not find a valid BMP180 sensor. Exiting program.");
    return;
  }

  Serial.println("BMP180 found");

  if (!checkAHT10()) {
    sendErrorMessage("Could not find a valid AHT10 sensor. Exiting program.");
    return;
  }

  Serial.println("AHT10 found");

}

void loop() {
  // Check if BMP180 sensor is still working
  if (!bmp.begin()) {
    sendErrorMessage("BMP180 sensor disconnected.");
    delay(1000);
    return;
  }

  // Check if AHT10 sensor is still working
  if (!aht.begin()) {
      delay(1000);
      sendErrorMessage("AHT10 sensor disconnected.");
      return;
    }

  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  
  //BPM180 - temperature, pressure  
  float temperature = bmp.readTemperature();
  String temperatureString = String(temperature);
  const char* temperatureCString = temperatureString.c_str();
  
  float pressure = bmp.readPressure();
  String pressureString = String(pressure);
  const char* pressureCString = pressureString.c_str();

  //AHT10 - temperature, humidity
  sensors_event_t humidity, temp;
  
  aht.getEvent(&humidity, &temp);
  
  float ahtTemperature = temp.temperature;
  String ahtTemperatureString = String(ahtTemperature);
  const char* ahtTemperatureCString = ahtTemperatureString.c_str();
  
  float ahtHumidity = humidity.relative_humidity;
  String ahtHumidityString = String(ahtHumidity);
  const char* ahtHumidityCString = ahtHumidityString.c_str();

  //Publish data to the server
  char publishMessage[256] = "";

  strcpy(publishMessage, temperatureCString);
  strcat(publishMessage, ",");
  strcat(publishMessage, pressureCString);
  strcat(publishMessage, "-");
  strcat(publishMessage, ahtTemperatureCString);
  strcat(publishMessage, ",");
  strcat(publishMessage, ahtHumidityCString);
    
  client.publish(topic, publishMessage);
  delay(1000);

  //Show values in serial monitor
  Serial.print("Temperature = ");
  Serial.print(temperature);
  Serial.println(" *C");

  Serial.print("Pressure = ");
  Serial.print(pressure);
  Serial.println(" Pa");

  Serial.print("Temperature_AHT: "); Serial.print(ahtTemperature); Serial.println(" degrees C"); 
  Serial.print("Humidity: "); Serial.print(ahtHumidity); Serial.println("% rH");
}

bool connectToWiFi() {
  WiFi.begin(ssid, password);
  int attempt = 0; // Counter for attempts
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
    attempt++;
    if (attempt >= 10) {
      Serial.println("Failed to connect to WiFi. Exiting program.");
      return false;
    }
  }
  Serial.println("Connected to WiFi");
  return true;
}

bool checkBMP180() {
  int attempt = 0;
  while (!bmp.begin()) {
    Serial.println("Could not find a valid BMP085 sensor, check wiring!");
    delay(1000);
    attempt++;
    if (attempt >= 10) {
      Serial.println("Could not find a valid BMP085 sensor. Exiting program.");
      return false;
    }
  }
  return true;
}

bool checkAHT10() {
  int attempt = 0;
  while (!aht.begin()) {
    Serial.println("Could not find AHT10, check wiring");
    delay(1000);
    attempt++;
    if (attempt >= 10) {
      Serial.println("Could not find a valid AHT10. Exiting program.");
      return false;
    }
  }
  return true;
}

void reconnect() {
  while (!client.connected()) {
    Serial.println("Attempting MQTT connection...");
    if (client.connect("ArduinoClient")) {
      Serial.println("Connected to MQTT broker");
    } else {
      Serial.print("Failed, rc=");
      Serial.print(client.state());
      Serial.println(" retrying in 5 seconds");
      delay(5000);
    }
  }
}

void sendErrorMessage(const char* message) {
  client.publish(topic, message);
}
