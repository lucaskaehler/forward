import { Injectable } from '@angular/core';

@Injectable()
export class HelperService {
  getGridNoDataText(loading: boolean, data: any[]) {
    return loading ? "LOADING DATA" : (data ? (data.length > 0 ? "NO DATA BASED ON FILTERS APPLIED" : "NO DATA TO DISPLAY") : "ERROR LOADING DATA");
  }

  handleError(error: any): Promise<any> {
    return Promise.reject(error);
  }


}