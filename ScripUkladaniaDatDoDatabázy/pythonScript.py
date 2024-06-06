import mysql.connector
import paho.mqtt.client as mqtt
from datetime import datetime

# MQTT settings
mqtt_broker_host = "127.0.0.1"
topic = "arduino/data"

# MySQL settings
mysqlHost = "127.0.0.1"
mysql_user = "admin"
mysql_password = "admin"
mysql_database = "sensors"

# Connect to MySQL
db_connection = mysql.connector.connect(
    host=mysqlHost,
    user=mysql_user,
    password=mysql_password,
    database=mysql_database
)
db_cursor = db_connection.cursor()

# MQTT on_connect callback
def on_connect(client, userdata, flags, rc):
    print("Connected with result code "+str(rc))
    client.subscribe(topic)

# MQTT on_message callback
def on_message(client, userdata, msg):
    data = msg.payload.decode()
    
    if data == "BMP180 sensor disconnected." or data == "AHT10 sensor disconnected.":
        insert_bmp180_data("error", "error")
        insert_aht10_data("error", "error")
        return
        
    bmp_data, aht_data = data.split('-')

    # Parse BMP180 data
    bmp_temperature, bmp_pressure = bmp_data.split(',')
    insert_bmp180_data(bmp_temperature, bmp_pressure)

    # Parse AHT10 data
    aht_temperature, aht_humidity = aht_data.split(',')
    insert_aht10_data(aht_temperature, aht_humidity)

# Insert BMP180 data into MySQL
def insert_bmp180_data(temperature, pressure):
    try:
        insert_query = "INSERT INTO bmp180 (temperature, pressure, created_at) VALUES (%s, %s, %s)"
        created_at = datetime.now()
        data = (temperature, pressure, created_at)
        db_cursor.execute(insert_query, data)
        db_connection.commit()
    except mysql.connector.Error as err:
        print("Error inserting BMP180 data:", err)

# Insert AHT10 data into MySQL
def insert_aht10_data(temperature, humidity):
    try:    
        insert_query = "INSERT INTO aht10 (temperature, humidity, created_at) VALUES (%s, %s, %s)"
        created_at = datetime.now()
        data = (temperature, humidity, created_at)
        db_cursor.execute(insert_query, data)
        db_connection.commit()
    except mysql.connector.Error as err:
        print("Error inserting AHT10 data:", err)

while True:
    try: 
        # Initialize MQTT client
        client = mqtt.Client()
        client.on_connect = on_connect
        client.on_message = on_message

        # Connect to MQTT broker
        client.connect(mqtt_broker_host, 1883, 60)

        # Start loop
        client.loop_forever()
    except Exception as e:
        print("An exception occured: {e}")
