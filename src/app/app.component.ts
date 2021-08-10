import { UtilsService } from './services/utils.service';
import { GraphService } from './services/graph.service';
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as FusionCharts from 'fusioncharts';
import { error } from '@angular/compiler/src/util';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  htfData = [];
  htfHaData = [];
  data = [];
  obData = [];
  haData = [];
  inLong = false;
  inShort = false;
  allTrades = [];
  winTrades = [];
  loseTrades = [];
  looseIncLong = 0;
  looseIncShort = 0;
  dataSourceRisk: any;
  dataSourceCandle: any;
  displayChart = true;

  constructor(private graphService: GraphService, private utils: UtilsService) { }

  async ngOnInit() {
    //this.htfData = await this.utils.getDataFromApi("https://btc.history.hxro.io/1h");
    this.data = await this.utils.getDataFromApi("https://btc.history.hxro.io/1m");
    //this.data = await this.utils.getDataFromFile('data.txt');
    this.haData = this.utils.setHeikenAshiData(this.data);
    this.htfHaData = this.utils.setHeikenAshiData(this.htfData);
    console.log('data', JSON.stringify(this.data))
    const rsiValues = this.rsi(this.data, 14);

    //this.obData = await this.utils.getDataFromFile('dataOb.txt');
    /* this.obData.forEach(element => {
      const date = new Date(element.time);
      element.time = date.setHours(date.getHours() + 2);
    }) */


    for (let i = 10; i < this.data.length; i++) {

      if (this.inLong) {
        if (this.isUp(this.data, i, 0)) {
          this.allTrades.push(this.utils.addFees(0.91));
          this.winTrades.push(this.utils.addFees(0.91));
          console.log('Resultat ++', this.round(this.utils.arraySum(this.allTrades), 2), this.utils.getDate(this.data[i].time));
          this.looseIncLong = 0;
        } else {
          this.allTrades.push(-1);
          this.loseTrades.push(-1);
          console.log('Resultat --', this.round(this.utils.arraySum(this.allTrades), 2), this.utils.getDate(this.data[i].time));
          this.looseIncLong++;
        }

        if (this.stopConditions(i)) {
          this.inLong = false;
          this.looseIncLong = 0;
          console.log('Exit bull loose streak', this.utils.getDate(this.data[i].time));
        } else if (this.haData[i].bear) {
          this.inLong = false;
          this.looseIncLong = 0;
          console.log('Exit bull setup', this.utils.getDate(this.data[i].time));
        }
      }

      else if (this.inShort) {
        if (!this.isUp(this.data, i, 0)) {
          this.allTrades.push(this.utils.addFees(0.91));
          this.winTrades.push(this.utils.addFees(0.91));
          console.log('Resultat ++', this.round(this.utils.arraySum(this.allTrades), 2), this.utils.getDate(this.data[i].time));
          this.looseIncShort = 0;
        } else {
          this.allTrades.push(-1);
          this.loseTrades.push(-1);
          console.log('Resultat --', this.round(this.utils.arraySum(this.allTrades), 2), this.utils.getDate(this.data[i].time));
          this.looseIncShort++;
        }

        if (this.stopConditions(i)) {
          this.inShort = false;
          this.looseIncShort = 0;
          console.log('Exit short loose streak', this.utils.getDate(this.data[i].time));
        } else if (this.haData[i].bull) {
          this.inShort = false;
          this.looseIncShort = 0;
          console.log('Exit short setup', this.utils.getDate(this.data[i].time));
        }
      }

      const lookback = 6;
      if (this.bullStrategy(this.haData, this.data, i, lookback, rsiValues, this.obData)) {
        this.inLong = true;
      } else if (this.bearStrategy(this.haData, this.data, i, lookback, rsiValues, this.obData)) {
        this.inShort = true;
      }
    }

    console.log('-------------');
    console.log('Trades : Gagnes / Perdus / Total', this.winTrades.length, this.loseTrades.length, this.winTrades.length + this.loseTrades.length);
    console.log('Total R:R', this.utils.round(this.loseTrades.reduce((a, b) => a + b, 0) + this.winTrades.reduce((a, b) => a + b, 0), 2));
    console.log('Avg R:R', this.utils.round(this.allTrades.reduce((a, b) => a + b, 0) / this.allTrades.length, 2));
    console.log('Winrate ' + this.utils.round((this.winTrades.length / (this.loseTrades.length + this.winTrades.length)) * 100, 2) + '%');
    this.initGraphProperties(this.data, this.allTrades);
  }








  /**
  * Initiation des propriétés du graphique.
  */
  initGraphProperties(data: any, dataRisk: any): void {
    const finalData = data.map((res) => {
      return [this.utils.getDateFormat(res.time), res.open, res.high, res.low, res.close];
    });

    const fusionTable = new FusionCharts.DataStore().createDataTable(finalData, this.graphService.schema);
    this.dataSourceCandle = this.graphService.dataSource;
    this.dataSourceCandle.data = fusionTable;

    this.dataSourceRisk = this.graphService.dataRisk;
    this.dataSourceRisk.data = this.utils.formatDataForGraphLine(dataRisk);
  }

  getHtfHeikenAshi(j: number) {
    const stfTime = this.data[j].time;

    for (let i = 2; i < this.htfData.length; i++) {
      const htfTime = this.htfData[i].time;
      const htfTime1 = this.htfData[i - 1].time;

      if (stfTime > htfTime1 && stfTime < htfTime) {
        return this.htfHaData[i - 2];
      }
    }
  }

  stopConditions(i: number): boolean {
    return (
      this.looseIncLong == 5 ||
      this.looseIncShort == 5 ||
      Math.abs(this.high(this.data, i, 0) - this.low(this.data, i, 0)) > 50
    ) ? true : false;
  }

  bullStrategy(haData: any, data: any, i: number, lookback: number, rsiValues: any, obData: any): any {
    let cond = true;
    for (let j = (i - 1); j >= (i - lookback); j--) {
      const ha = haData[j];
      if (ha.close > ha.open) { // if bull
        cond = false;
        break;
      }
    }

    let ObCond = false;
    let obDate;
    const candleDate = Date.parse(this.utils.getDateFormat(data[i].time));

    /* for (let k = 0; k < obData.length; k++) {
      const element = obData[k];
      obDate = Date.parse(this.utils.getDateFormat(element.time));
      if (obDate == candleDate) {
        if (element.ratio1 > 30) {
          ObCond = true;
          break;
        }
      }
    } */

    if (cond
      && haData[i].bull
      //&& ObCond
      && rsiValues[i] < 40
    ) {
      console.log('Entry bull setup', this.utils.getDate(data[i].time));
      return true;
    } else {
      return false;
    }
  }


  bearStrategy(haData: any, data: any, i: number, lookback: number, rsiValues: any, obData: any): any {
    let cond = true;
    for (let j = (i - 1); j >= (i - lookback); j--) {
      const ha = haData[j];
      if (ha.close < ha.open) { // if bear
        cond = false;
        break;
      }
    }

    let ObCond = false;
    let obDate;
    const candleDate = Date.parse(this.utils.getDateFormat(data[i].time));

    /*   for (let k = 0; k < obData.length; k++) {
        const element = obData[k];
        obDate = Date.parse(this.utils.getDateFormat(element.time));
        if (obDate == candleDate) {
          if (element.ratio1 < -30) {
            ObCond = true;
            break;
          }
        }
      } */


    if (cond
      && haData[i].bear
      //&& ObCond
      && rsiValues[i] > 60
    ) {
      console.log('Entry bear setup', this.utils.getDate(data[i].time));
      return true;
    } else {
      return false;
    }
  }

  /*   getObCandle(obData: any, data: any) {
      obData.forEach(element => {
        let obDate = Date.parse(this.utils.getDateFormat(element.time));
        if (obDate == data.time) {
            return element;
        }
      });
    } */

  rsi(candlesticks: any, window: number): any {
    const $close = [];
    for (let j = 0; j < candlesticks.length; j++) {
      $close.push(candlesticks[j].close);
    }

    const gains = [0];
    const loss = [1e-14];
    for (let i = 1, len = $close.length; i < len; i++) {
      const diff = $close[i] - $close[i - 1];
      gains.push(diff >= 0 ? diff : 0);
      loss.push(diff < 0 ? -diff : 0);
    }
    const emaGains = this.ema(gains, 2 * window - 1);
    const emaLoss = this.ema(loss, 2 * window - 1);
    return this.pointwise((a: number, b: number) => 100 - 100 / (1 + a / b), this.ema(gains, 2 * window - 1), this.ema(loss, 2 * window - 1));
  }

  pointwise(operation: Function, ...serieses: Array<Array<number>>): any {
    const result = [];
    for (let i = 0, len = serieses[0].length; i < len; i++) {
      const iseries = (i: number) => serieses.map(x => x[i]);
      result[i] = operation(...iseries(i));
    }
    return result;
  }

  ema(series: Array<number>, window: number, start?: number): any {
    const weight = 2 / (window + 1);
    const ema = [start ? start : this.mean(series.slice(0, window))];
    for (let i = 1, len = series.length; i < len; i++) {
      ema.push(series[i] * weight + (1 - weight) * ema[i - 1]);
    }
    return ema;
  }

  mean(series: Array<number>): any {
    let sum = 0;
    for (let i = 0; i < series.length; i++) {
      sum += series[i];
    }
    return sum / series.length;
  }



  /**
  * Arrondi un nombre avec une certaine précision.
  */
  round(value: number, precision: number): number {
    const multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
  }

  isUp(data: any, index: number, lookback: number): boolean {
    return (data[index - lookback].close > data[index - lookback].open);
  }
  open(data: any, index: number, lookback: number): number {
    return data[index - lookback].open;
  }
  close(data: any, index: number, lookback: number): number {
    return data[index - lookback].close;
  }
  high(data: any, index: number, lookback: number): number {
    return data[index - lookback].high;
  }
  low(data: any, index: number, lookback: number): number {
    return data[index - lookback].low;
  }
}
