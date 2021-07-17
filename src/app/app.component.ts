import { UtilsService } from './services/utils.service';
import { GraphService } from './services/graph.service';
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as FusionCharts from 'fusioncharts';


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
  looseInc = 0;
  looseInc2 = 0;
  dataSourceRisk: any;
  dataSourceCandle: any;
  displayChart = true;
  lh = 0;
  ll = 0;

  constructor(private http: HttpClient, private graphService: GraphService, private utils: UtilsService) { }

  async ngOnInit() {
    //this.data = await this.getDataFromApi();
    this.data = await this.getDataFromFile();
    this.haData = this.utils.setHeikenAshiData(this.data);
    console.log('data', JSON.stringify(this.data))
    const rsiValues = this.rsi(this.data, 14);

    for (let i = 10; i < this.data.length; i++) {

      if (this.inLong && this.inShort) {
        console.log('ERRROR')
      }

      if (this.inLong) {
        if (this.isUp(this.data, i, 0)) {
          this.allTrades.push(this.utils.addFees(0.91));
          this.winTrades.push(this.utils.addFees(0.91));
          console.log('Resultat ++', this.round(this.utils.arraySum(this.allTrades), 2), this.utils.getDate(this.data[i].time));
          this.looseInc = 0;
        } else {
          this.allTrades.push(-1);
          this.loseTrades.push(-1);
          console.log('Resultat --', this.round(this.utils.arraySum(this.allTrades), 2), this.utils.getDate(this.data[i].time));
          this.looseInc++;
        }

        if (this.stopConditions(i)) {
          this.inLong = false;
          this.looseInc = 0;
          console.log('Exit bull loose streak', this.utils.getDate(this.data[i].time));
        } else if (this.haData[i].close < this.haData[i].open) {
          this.inLong = false;
          this.looseInc = 0;
          console.log('Exit bull setup', this.utils.getDate(this.data[i].time));
        }
      }


      if (this.inShort) {
        if (!this.isUp(this.data, i, 0)) {
          this.allTrades.push(this.utils.addFees(0.91));
          this.winTrades.push(this.utils.addFees(0.91));
          console.log('Resultat ++', this.round(this.utils.arraySum(this.allTrades), 2), this.utils.getDate(this.data[i].time));
          this.looseInc2 = 0;
        } else {
          this.allTrades.push(-1);
          this.loseTrades.push(-1);
          console.log('Resultat --', this.round(this.utils.arraySum(this.allTrades), 2), this.utils.getDate(this.data[i].time));
          this.looseInc2++;
        }

        if (this.stopConditions(i)) {
          this.inShort = false;
          this.looseInc2 = 0;
          console.log('Exit short loose streak', this.utils.getDate(this.data[i].time));
        } else if (this.haData[i].close > this.haData[i].open) {
          this.inShort = false;
          this.looseInc2 = 0;
          console.log('Exit short setup', this.utils.getDate(this.data[i].time));
        }
      }

      const lookback = 6;
      if (this.bullStrategy(this.haData, this.data, i, lookback, rsiValues)) {
        this.inLong = true;
      } else if (this.bearStrategy(this.haData, this.data, i, lookback, rsiValues)) {
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
   * Parse et push les donnees CSV.
   */
  getDataFromFile(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this.http.get('assets/data.txt', { responseType: 'text' }).subscribe(
        (data) => {
          //console.log(JSON.parse(data))
          resolve(JSON.parse(data));
        },
        (error) => {
          console.log(error);
          reject(error);
        }
      );
    });
  }

  getDataFromApi(): Promise<any> {
    return new Promise<void>((resolve, reject) => {
      this.http.get("https://btc.history.hxro.io/1m").subscribe(
        (res: any) => {
          resolve(res.data);
        },
        (error) => {
          console.log(error);
          reject(error);
        })
    })
  }


  stopConditions(i: number): boolean {
    return (
      this.looseInc == 3 ||
      this.looseInc2 == 3 ||
      Math.abs(this.high(this.data, i, 0) - this.low(this.data, i, 0)) > 80
    ) ? true : false;
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


  bullStrategy(haData: any, data: any, i: number, lookback: number, rsiValues: any): any {
    let cond = true;
    for (let j = (i - 1); j >= (i - lookback); j--) {
      const ha = haData[j];
      if (ha.close > ha.open) { // if bull
        cond = false;
        break;
      }
    }

    if (cond && haData[i].close > haData[i].open && rsiValues[i] < 40) {
      console.log('Entry bull setup', this.utils.getDate(data[i].time));
      return true;
    } else {
      return false;
    }
  }


  bearStrategy(haData: any, data: any, i: number, lookback: number, rsiValues: any): any {
    let cond = true;
    for (let j = (i - 1); j >= (i - lookback); j--) {
      const ha = haData[j];
      if (ha.close < ha.open) { // if bear
        cond = false;
        break;
      }
    }

    if (cond && haData[i].close < haData[i].open && rsiValues[i] > 60) {
      console.log('Entry bear setup', this.utils.getDate(data[i].time));
      return true;
    } else {
      return false;
    }
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
}
