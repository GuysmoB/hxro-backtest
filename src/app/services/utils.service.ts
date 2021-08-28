import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  constructor(private http: HttpClient) {
  }

  /**
   * Fait la somme des nombres d'un tableau
   */
  arraySum(array: any) {
    return array.reduce((a, b) => a + b, 0);
  }



  /**
   * Retourne la valeur maximale en fonction de la source et de lookback
   */
  highest(data: any, index: number, source: string, lookback: number): number {
    let max: number;

    for (let k = 0; k < lookback; k++) {
      if (k === 0) {
        max = data[index - k][source];
      }

      if (data[index - k][source] > max) {
        max = data[index - k][source];
      }
    }
    return max;
  }


  /**
   * Retourne la valeur minimale en fonction de la source et de lookback
   */
  lowest(data: any, index: number, source: string, lookback: number): number {
    let min: number;

    for (let k = 0; k < lookback; k++) {
      if (k === 0) {
        min = data[index - k][source];
      }

      if (data[index - k][source] < min) {
        min = data[index - k][source];
      }
    }
    return min;
  }


  /**
   * Arrondi un nombre avec une certaine précision.
   */
  round(value: number, precision: number): number {
    const multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
  }


  /**
   * Retourne l'équivalent HeikenAshi
   */
  setHeikenAshiData(source: any): any {
    const result = [];

    for (let j = 0; j < source.length; j++) {
      if (j === 0) {
        const $close = this.round((source[j].open + source[j].high + source[j].low + source[j].close) / 4, 5);
        const $open = this.round((source[j].open + source[j].close) / 2, 5);
        result.push({
          close: $close,
          open: $open,
          low: source[j].low,
          high: source[j].high,
          bull: $close > $open,
          bear: $close < $open,
          time: source[j].time
        });
      } else {
        const $close = (source[j].open + source[j].high + source[j].low + source[j].close) / 4;
        const $open = (result[result.length - 1].open + result[result.length - 1].close) / 2;
        result.push({
          close: this.round($close, 5),
          open: this.round($open, 5),
          low: this.round(Math.min(source[j].low, Math.max($open, $close)), 5),
          high: this.round(Math.max(source[j].high, Math.max($open, $close)), 5),
          bull: $close > $open,
          bear: $close < $open,
          time: source[j].time
        });
      }
    }
    return result;
  }


  /**
   * Parse et push les donnees CSV.
   */
  getDataFromFile(file: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this.http.get('assets/' + file, { responseType: 'text' }).subscribe(
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

  getDataFromApi(url: string): Promise<any> {
    return new Promise<void>((resolve, reject) => {
      this.http.get(url).subscribe(
        (res: any) => {
          resolve(res.data);
        },
        (error) => {
          console.log(error);
          reject(error);
        })
    })
  }


  /**
     * Parse et push les donnees CSV.
     */
  getDataFromCsv(file: string): Promise<any> {
    let allData = [];
    return new Promise<any>((resolve, reject) => {
      this.http.get('assets/' + file, { responseType: 'text' }).subscribe(
        (data) => {
          const csvToRowArray = data.split('\r\n');
          for (let index = 1; index < csvToRowArray.length - 1; index++) {
            const element = csvToRowArray[index].split(','); // d, o, h, l, c, v
            allData.push({
              time: +element[0],
              open: +parseFloat(element[1]),
              high: +parseFloat(element[2]),
              low: +parseFloat(element[3]),
              close: +parseFloat(element[4])
            });
          }
          console.log(allData[0])
          resolve(allData);
        },
        (error) => {
          console.log(error);
          reject(error);
        }
      );
    });
  }

  /**
   * Retourne un tableau avec la somme des R:R pour le graph line
   */
  formatDataForGraphLine(data: any): any {
    const result = [];

    for (let i = 0; i < data.length; i++) {
      if (result.length === 0) {
        result.push({ label: i, value: data[i] });
      } else {
        const toAdd = result[result.length - 1].value;
        result.push({ label: i, value: data[i] + toAdd });
      }
    }
    return result;
  }



  /**
  * Retourne la date avec décalage horaire.
  */
  getDate(timestamp: any): any {
    let date = new Date(timestamp);
    const year = date.getFullYear();
    const month = '0' + (date.getMonth() + 1);
    const day = '0' + date.getDate();
    const hours = '0' + date.getHours();
    const minutes = '0' + date.getMinutes();
    const second = '0' + date.getSeconds();
    return day.substr(-2) + '/' + month.substr(-2) + '/' + year + ' ' + hours.substr(-2) + ':' + minutes.substr(-2) + ':' + second.substr(-2);
  }


  /**
  * Retourne la date avec décalage horaire. '%Y-%m-%d %H:%M'
  */
  getDateFormat(timestamp: any): any {
    let date = new Date(timestamp);
    const year = date.getFullYear();
    const month = '0' + (date.getMonth() + 1);
    const day = '0' + date.getDate();
    const hours = '0' + date.getHours();
    const minutes = '0' + date.getMinutes();
    return year + '-' + month + '-' + day.substr(-2) + ' ' + hours.substr(-2) + ':' + minutes.substr(-2);
  }

  /**
   * Prend en compte les fees de Hxro
   */
  addFees(gain: number) {
    return gain - (gain * 0.03)
  }


  /**
   * Trouve le dernier high avec pattern HA
   */
  lastHigh(haData: any, data: any, i: number) {
    const cond = haData[i - 5].close > haData[i - 5].open && haData[i - 4].close > haData[i - 4].open && haData[i - 3].close > haData[i - 3].open
      && haData[i - 2].close < haData[i - 2].open && haData[i - 1].close < haData[i - 1].open && haData[i].close < haData[i].open;

    if (cond) {
      console.log('LastHigh', this.getDate(data[i].time), this.highest(data, i, 'high', 6));
      return this.highest(data, i, 'high', 6)
    }
  }

  /**
   * Trouve le dernier low avec pattern HA
   */
  lastLow(haData: any, data: any, i: number) {
    const cond = haData[i - 5].close < haData[i - 5].open && haData[i - 4].close < haData[i - 4].open && haData[i - 3].close < haData[i - 3].open
      && haData[i - 2].close > haData[i - 2].open && haData[i - 1].close > haData[i - 1].open && haData[i].close > haData[i].open;

    if (cond) {
      console.log('LastLow', this.getDate(data[i].time), this.lowest(data, i, 'low', 6));
      return this.lowest(data, i, 'low', 6)
    }
  }

}
