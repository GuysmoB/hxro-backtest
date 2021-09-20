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
      name: 'Ratio2p5',
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
            value: 'Ratio2p5',
            type: 'line',
            connectnulldata: true
          },
        ],
      },
    ],
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

  dataInterest = {
    chart: {
      caption: 'Intérêts composés',
      yaxisname: '$',
      rotatelabels: '1',
      setadaptiveymin: '1',
      theme: 'fusion',
      drawAnchors: '0',
    },
    data: []
  };

  constructor() { }
}
