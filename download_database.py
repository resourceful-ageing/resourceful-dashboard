#!/usr/bin/env python3

import requests
import argparse

parser = argparse.ArgumentParser(description='Download data from bluemix cloudant')
parser.add_argument('user', help='username')
parser.add_argument('password', help='password')
parser.add_argument('db', help='name of the database, e.g. iotp_6tv4n6_default_2017-06-06')
args = parser.parse_args()

addr = "https://432c9dcf-0290-41c5-81cc-b02b0d24651e-bluemix.cloudant.com/" + args.db + "/_all_docs?include_docs=true"
r = requests.get(addr, auth=(args.user, args.password))

with open(args.db + '.json', 'w') as f:
    f.write(r.text)

