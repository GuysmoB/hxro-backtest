import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GraphService {

  schema = [
    {
      name: 'Date',
      type: 'date',
      format: '%Y-%m-%d %H:%M',
    },
    {
      name: 'Open',
      type: 'number',
    },
    {
      name: 'High',
      type: 'number',
    },
    {
      name: 'Low',
      type: 'number',
    },
    {
      name: 'Close',
      type: 'number',
    },
    {
      name: 'Ratio1',
      type: 'number',
    },
  ];

  dataSource = {
    navigator: {
      enabled: false,
    },
    chart: {
      theme: 'candy',
    },
    data: null,
    xAxis: {
      plot: 'Time',
      timemarker: [],
    },
    yaxis: [
      {
        plot: [
          {
            value: {
              open: 'Open',
              high: 'High',
              low: 'Low',
              close: 'Close',
            },
            type: 'candlestick',
          },
        ],
      },
      {
        plot: [
          {
            value: 'Ratio1',
            type: 'line',
          },
        ],
      },
    ],
  };




  /*

  OB

  */
  schemaOb = [
    {
      name: 'Date',
      type: 'date',
      format: '%Y-%m-%d %H:%M'
    },
    {
      name: 'Ratio1',
      type: 'number'
    }
  ];

  dataSourceOb = {
    chart: {
      theme: 'candy'
    },
    data: null,
    yaxis: [
      {
        plot: {
          value: 'Ratio1',
          type: 'line',
          connectnulldata: true
        }
      }
    ]
  };


  dataRisk = {
    chart: {
      caption: 'Gains en R:R',
      yaxisname: 'R:R',
      rotatelabels: '1',
      setadaptiveymin: '1',
      theme: 'fusion',
      drawAnchors: '0'
    },
    data: []
  };


  constructor() { }
}
