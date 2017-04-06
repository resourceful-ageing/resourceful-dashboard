# resourceful-dashboard

## Installation
Before you are able to use the dashboard, you need to fill in the IBM application credentials.
These can be found...

Edit "appClient.properties"
```shell
auth-key=...
auth-token=...
```

### Run dashboard locally
Edit "vcap-local.json" with the credentials from IBM's CloudantDB.
These can be found...
```shell
npm start
```
## Deploy to IBM Cloud
To deploy the application to IBM cloud, use Cloud Foundy.
```shell
cp push
```

After deployment is done and the app has been restarted, open https://resourceful-ageing-app.eu-gb.mybluemix.net to to verify the changes.