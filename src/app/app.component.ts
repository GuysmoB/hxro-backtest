import { UtilsService } from './services/utils.service';
import { GraphService } from './services/graph.service';
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as FusionCharts from 'fusioncharts';
import { indicatorExponentialMovingAverage } from '@d3fc/d3fc-technical-indicator';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  data = [];
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
  emaFastData: any;
  emaSlowData: any;
  lookback = 1;
  rsiBull = 40;
  rsiBear = 60;
  ratioBull = 20;
  ratioBear = -20;
  tfInterval = 5;
  iSnap: number;

  constructor(private graphService: GraphService, private utils: UtilsService) { }

  async ngOnInit() {
    //this.data = await this.utils.getDataFromCsv('eth1_kraken.txt');
    //this.data = await this.utils.getBnbFromCsv();
    this.data = await this.utils.getDataFromFirebase('orderbook-data');
    console.log(this.data[0])
    this.haData = this.utils.setHeikenAshiData(this.data);
    const rsiValues = this.rsi(this.data, 14);

    console.log(this.data.length, this.data[0]);
    for (let i = this.data.length - 1; i >= 1; i--) {
      if (this.data[i].open == this.data[i - 1].open && this.data[i].close == this.data[i - 1].close && this.data[i].high == this.data[i - 1].high && this.data[i].low == this.data[i - 1].low) {
        this.data.splice(i, 1);
        //console.log(this.utils.getDateFormat(this.data[i].time), this.data[i].open, this.data[i].close)
      }
    }
    console.log(this.data.length);

    for (let i = this.data.length - 1; i >= 1; i--) {
      if (this.data[i].ratio1 == this.data[i - 1].ratio1 && this.data[i].ratio2p5 == this.data[i - 1].ratio2p5 && this.data[i].ratio5 == this.data[i - 1].ratio5) {
        this.data.splice(i, 1);
        console.log(this.utils.getDateFormat(this.data[i].time), this.data[i].ratio2p5)
      }
    }
    console.log(this.data.length);

    for (let i = 10; i < this.data.length; i++) {
      if (this.inLong) {
        if (i == this.iSnap + this.tfInterval) {
          if (this.isUpInterval(this.data, i, this.tfInterval)) {
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
          } else {
            this.iSnap = i;
          }
        }

      } else if (this.inShort) {
        if (i == this.iSnap + this.tfInterval) {
          if (!this.isUpInterval(this.data, i, this.tfInterval)) {
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
          } else {
            this.iSnap = i;
          }
        }
      }

      if ((this.inLong && this.inShort)) {
        console.log('test');;
      }

      if ((this.inLong || this.inShort) && i >= this.iSnap + this.tfInterval) {
        console.log('test');;
      }

      if (!this.inLong && !this.inShort) {
        if (this.isTimeMatchingTf(i)) {
          if (this.bullStrategy(this.haData, this.data, i, rsiValues)) {
            this.inLong = true;
            this.iSnap = i;
          } else if (this.bearStrategy(this.haData, this.data, i, rsiValues)) {
            this.inShort = true;
            this.iSnap = i;
          }
        }
      }
    }

    console.log('-------------');
    console.log('Trades : Gagnes / Perdus / Total', this.winTrades.length, this.loseTrades.length, this.winTrades.length + this.loseTrades.length);
    console.log('Total R:R', this.utils.round(this.loseTrades.reduce((a, b) => a + b, 0) + this.winTrades.reduce((a, b) => a + b, 0), 2));
    console.log('Avg R:R', this.utils.round(this.allTrades.reduce((a, b) => a + b, 0) / this.allTrades.length, 2));
    console.log('Winrate ' + this.utils.round((this.winTrades.length / (this.loseTrades.length + this.winTrades.length)) * 100, 2) + '%');
    this.initGraphProperties(this.data, this.allTrades);
  }



  bullStrategy(haData: any, data: any, i: number, rsiValues: any): any {
    let cond = true;
    for (let j = (i - 1); j >= (i - this.lookback); j--) {
      if (haData[j].bull) {
        cond = false;
        break;
      }
    }

    if (
      //cond &&
      rsiValues[i] < this.rsiBull &&
      data[i].ratio2p5 > this.ratioBull /* &&
      data[i].ratio1 > 20 */
    ) {
      console.log('Entry bull setup', this.utils.getDate(data[i].time));
      return true;
    } else {
      return false;
    }
  }


  bearStrategy(haData: any, data: any, i: number, rsiValues: any): any {
    let cond = true;
    for (let j = (i - 1); j >= (i - this.lookback); j--) {
      if (haData[j].bear) {
        cond = false;
        break;
      }
    }

    if (
      //cond &&
      rsiValues[i] > this.rsiBear &&
      data[i].ratio2p5 < this.ratioBear /* &&
      data[i].ratio1 < -20 */
    ) {
      console.log('Entry bear setup', this.utils.getDate(data[i].time));
      return true;
    } else {
      return false;
    }
  }


  isTimeMatchingTf(i: any) {
    let minute = new Date(this.data[i].time).getMinutes();
    return (
      (this.tfInterval == 5 && (minute.toString().substr(-1) == '4' || minute.toString().substr(-1) == '9')) ||
      (this.tfInterval == 15 && (minute == 14 || minute == 29 || minute == 44 || minute == 59)) ||
      (this.tfInterval == 1)
    ) ? true : false;
  }



  stopConditions(i: number): boolean {
    return (
      this.looseIncLong == 0 ||
      this.looseIncShort == 0
    ) ? true : false;
  }


  /**
  * Initiation des propriétés du graphique.
  */
  initGraphProperties(data: any, dataRisk: any): void {
    const finalData = data.map((res) => {
      return [this.utils.getDateFormat(res.time), res.open, res.high, res.low, res.close, res.ratio2p5];
    });

    const fusionTable = new FusionCharts.DataStore().createDataTable(finalData, this.graphService.schema);
    this.dataSourceCandle = this.graphService.dataSource;
    this.dataSourceCandle.data = fusionTable;

    this.dataSourceRisk = this.graphService.dataRisk;
    this.dataSourceRisk.data = this.utils.formatDataForGraphLine(dataRisk);
  }


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
  isUpInterval(data: any, index: number, lookback: number) {
    return data[index].close - data[index - lookback].close > 0;
  }
}
