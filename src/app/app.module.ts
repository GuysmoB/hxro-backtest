import { UtilsService } from './services/utils.service';
import { GraphService } from './services/graph.service';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AngularFireModule } from '@angular/fire';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';

// FusionChart
import { FusionChartsModule } from 'angular-fusioncharts';
import * as FusionCharts from 'fusioncharts';
import * as Charts from 'fusioncharts/fusioncharts.charts';
import * as FusionTheme from 'fusioncharts/themes/fusioncharts.theme.fusion';
import * as TimeSeries from 'fusioncharts/fusioncharts.timeseries';
import * as Candy from 'fusioncharts/themes/fusioncharts.theme.candy';


FusionChartsModule.fcRoot(FusionCharts, Charts, FusionTheme, TimeSeries, Candy);
const firebaseConfig = {
};

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FusionChartsModule,
    AngularFireModule.initializeApp(firebaseConfig)
  ],
  providers: [GraphService, UtilsService],
  bootstrap: [AppComponent]
})
export class AppModule { }
