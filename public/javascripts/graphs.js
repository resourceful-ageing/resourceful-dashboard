var graphData = {};

function makegraph(graphName, url, type, color, options) {
    options = typeof options === 'undefined' ? {} : options;
    var fromDate = getFromDate();

    graphData[graphName] = {
      xData: [],
      yData: []
    }

    $.get(url, function(data) {
        for (value in data) {
          graphData[graphName].yData.push(data[value].value);
          graphData[graphName].xData.push(new Date(data[value].timestamp));
        }
    }).then(function() {
        var ctx = document.getElementById(graphName);
        
        var datasetsOptions = {
          lineTension: 0,
          pointBorderColor: '#f00',
          label: graphName.split("Chart")[0],
          data: graphData[graphName].yData,
          borderWidth: 1,
          //backgroundColor: [
          //    color
          //],
        }

        var chartOptions = {
            type: type,
            data: {
              labels: graphData[graphName].xData,
              datasets: [ mergeObjects(datasetsOptions, options) ],
              lineTension: 0,
              pointBorderColor: '#f00',
              label: graphName.split("Chart")[0],
              data: graphData[graphName].yData,
              borderWidth: 1,
              //backgroundColor: [
              //    color
              //],
            },
            options: {
                tooltips: {
                  //enabled:false
                  //backgroundColor: ['Red']
                  titleFontSize: 14,
                  callbacks: {
                    title: function(tooltipItems, data) {
                      return capitalizeFirstLetter(data.datasets[0].label);
                    },
                    label: function(tooltipItems, data) {
                      return 'Value: ' + tooltipItems.yLabel + ", date: " + formattedDate(tooltipItems.xLabel);
                    }
                  }
                },
                responsive: true,
                maintainAspectRatio: false,
                legend: {
                  display: false
                },
                scales: {
                    xAxes : [{
                        type : 'time',
                        time: {
                          unit: 'hour',
                          displayFormats: {
                            hour: 'HH:mm',
                              //quarter: 'MMM YYYY'
                          },
                          min: fromDate,
                          max: new Date()
                        },
                        //format: 'MM/DD/YYYY HH:mm',
                        tooltipFormat: 'll HH:mm'
                    }],
                    yAxes: [{
                        ticks: {
                            beginAtZero:false
                        }
                    }]
                },
                zoom: {
                    enabled: true,
                    drag: true,
                    mode: 'x',
                    limits: {
                        max: 10,
                        min: 0.5
                    }
                }
            }
        }
        
        charts[graphName] = new Chart(ctx, chartOptions);

        /*
        ctx.addEventListener('click', function(evt) {
          var activePoints = charts[graphName].getElementsAtEvent(evt);
          var index = activePoints[0]._index;
          var xData = graphData[$(this).attr('id')].xData[index];
          var yData = graphData[$(this).attr('id')].yData[index];
          var formAnnotate = $('#formAnnotate');
          $('input[name="homeId"]').val(1234567);
          $('input[name="deviceId"]').val(3);
          
          $('input[name="value"]').val(yData);
          $('input[name="timestamp"]').val(xData);
          
          $('#showAnnotateModal').trigger('click');
        });
        */
        
        window.charts = charts;

    });
}

function getFromDate() {
  var d = new Date();
  d.setDate(d.getDate()-2);
  d.setHours(d.getHours() + Math.round(d.getMinutes()/60));
  d.setMinutes(0);
  return d;
}

function formattedDate(dateObj) {
  dateObj = typeof dateObj === 'undefined' ? Date.now() : dateObj;
  return new Date(dateObj).toLocaleString();
}

function capitalizeFirstLetter(s) { return s.charAt(0).toUpperCase() + s.slice(1); };

function mergeObjects(obj, src) {
    for (var key in src) {
        if (src.hasOwnProperty(key)) obj[key] = src[key];
    }
    return obj;
}

function resetZoom(chart) {
  charts[chart].resetZoom();
}

function showhome(home) {
    makegraph("temperatureChart"+homes[home], "/rtd/gettemperature/"+homes[home],'line', 'rgba(255, 0, 97, 0.9)');
    makegraph("lightChart"+homes[home], "/rtd/getlux/"+homes[home],'line', 'rgba(255, 197, 41, 0.9)');
    makegraph("humidityChart"+homes[home], "/rtd/gethumidity/"+homes[home],'line', 'rgba(0, 255, 194, 0.9)');
    makegraph("energyChart"+homes[home], "/rtd/getkwh/"+homes[home],'line', 'rgba(95, 232, 29, 0.9)');
    makegraph("presenceChart"+homes[home], "/rtd/getpresence/"+homes[home],'bar', 'rgba(95, 232, 29, 0.9)', { backgroundColor: '#dfdfdf', borderColor: '#dfdfdf' });
    
    makegraph("movementChart"+homes[home], "/rtd/getmovement/"+homes[home],'line', 'rgba(95, 232, 29, 0.9)', { fill: false, showLine: false} );
}


$(document).ready(function() {
  for (home in homes) {
     showhome(home);
  }
})
