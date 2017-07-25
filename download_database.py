#!/usr/bin/env python3

import datetime
import requests
import argparse
import json

def get_sensors(user, password):
    addr = "https://432c9dcf-0290-41c5-81cc-b02b0d24651e-bluemix.cloudant.com/sensors/_all_docs?include_docs=true"
    r = requests.get(addr, auth=(user, password))
    # create key value pair of sensorId -> gatewayId
    sensors = {}
    for row in r.json()['rows']:
        sensors[row['doc']['sensorId']] = row['doc']['gatewayId']
    return sensors


def strptime(d):
    return datetime.datetime.strptime(d, '%Y-%m-%d')


def download_db(user, password, db, sensors):
    addr = "https://432c9dcf-0290-41c5-81cc-b02b0d24651e-bluemix.cloudant.com/" + db + "/_all_docs?include_docs=true"
    r = requests.get(addr, auth=(user, password))
    if r.status_code != 200:
        print(db, "not found")
        return

    with open(db + '.json', 'w') as f:
        for row in r.json()['rows']:
            d = row['doc']
            try:
                device_id = d['deviceId']
                home_id = sensors[device_id] if device_id in sensors else ''
                event = d['eventType']
                data = d['data']['d']
                timestamp = d['timestamp']

                f.write(json.dumps({
                    'homeId': home_id,
                    'deviceId': device_id,
                    'event': event,
                    'timestamp': timestamp,
                    'data': data
                    }) + '\n')
            except KeyError:
                continue
    print(db, "done")


if __name__ == '__main__':

    db_prefix = 'iotp_6tv4n6_default_'
    parser = argparse.ArgumentParser(description='Download data from bluemix cloudant')
    parser.add_argument('user', help='username')
    parser.add_argument('password', help='password')
    parser.add_argument('start', type=strptime, help='start date in YYYY-MM-DD format')
    parser.add_argument('end', type=strptime, help='end date in YYYY-MM-DD format')
    args = parser.parse_args()

    sensors = get_sensors(args.user, args.password)
    start = args.start
    end = args.end

    while start <= end:
        download_db(args.user, args.password, db_prefix + start.strftime('%Y-%m-%d'), sensors)
        start += datetime.timedelta(days=1)

