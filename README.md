# resourceful-dashboard

## Installation
Before you are able to use the dashboard, you need to fill in the IBM application credentials.
To create new credentials (only when lost), login to https://6tv4n6.internetofthings.ibmcloud.com/dashboard/#/apps/apikeys-v2 -> "Generate API Key".

Edit "appClient.properties"
```shell
auth-key=...
auth-token=...
```

### Run dashboard locally
Edit "vcap-local.json" & ".cloudant" and add the credentials from IBM's CloudantDB.
To find the credentials, login to https://console.eu-gb.bluemix.net/dashboard/apps/ -> "All Services" -> "Cloudant NoSQL DB-wd" -> "Service credentials" -> "Actions" -> "View credentials".
```shell
npm start
```

May need to update packaged using `bower`

## Deploy to IBM Cloud
To deploy the application to IBM cloud, use Cloud Foundy.
```shell
cf push
```

After deployment is done and the app has been restarted, open https://resourceful-ageing-app.eu-gb.mybluemix.net to verify the changes.
