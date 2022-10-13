import { Injectable, EventEmitter, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subscription, timer } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class HttpService implements OnDestroy {
  public running: boolean = false;
  public requests: number = 0;
  public tick: number = 0;  
  private subscription: Subscription;
  private timer: Observable<number> = timer(0, 1000);
  public loading: EventEmitter<boolean>;

  constructor(private http: HttpClient) { 
    this.loading = new EventEmitter<boolean>();
  }

  get(url: string, responseType: "json" | "text" | "blob" | "arraybuffer" = "json", skipLoading: boolean = false): Promise<Object> {
    if(!skipLoading) {
      this.increment();
    }
    return responseType == "json" ? this.http.get(url).pipe(tap({next: x => x,error: err => this.decrement(skipLoading),complete: () => this.decrement(skipLoading)})).toPromise()
      : (responseType === "text" ? this.http.get(url, {responseType:"text"}).pipe(tap({next: x => x,error: err => this.decrement(skipLoading),complete: () => this.decrement(skipLoading)})).toPromise()
      : (responseType === "blob" ? this.http.get(url, {responseType:"blob"}).pipe(tap({next: x => x,error: err => this.decrement(skipLoading),complete: () => this.decrement(skipLoading)})).toPromise()
      : this.http.get(url, {responseType:"arraybuffer"}).pipe(tap({next: x => x,error: err => this.decrement(skipLoading),complete: () => this.decrement(skipLoading)})).toPromise()));
  }

  post(url: string, body: any, responseType: "json" | "text" | "blob" | "arraybuffer" = "json"): Promise<Object> {
    this.increment();
    const headers = new HttpHeaders().set("Content-Type", "application/json");
    return responseType == "json" ? this.http.post(url, body, {headers}).pipe(tap(x => x, x => this.decrement(), () => this.decrement())).toPromise()
      : this.http.post(url, body, {headers, responseType:"text"}).pipe(tap(x => x, x => this.decrement(), () => this.decrement())).toPromise();
  }

  put(url: string, body: any, responseType: "json" | "text" | "blob" | "arraybuffer" = "json"): Promise<Object> {
    this.increment();
    const headers = new HttpHeaders().set("Content-Type", "application/json");
    return responseType == "json" ? this.http.put(url, body, {headers}).pipe(tap(x => x, x => this.decrement(), () => this.decrement())).toPromise()
      : this.http.put(url, body, {headers, responseType:"text"}).pipe(tap(x => x, x => this.decrement(), () => this.decrement())).toPromise();
  }

  delete(url: string, responseType: "json" | "text" = "json"): Promise<Object> {
    this.increment();
    return responseType == "json" ? this.http.delete(url).pipe(tap(x => x, x => this.decrement(), () => this.decrement())).toPromise()
      : this.http.delete(url, {responseType:"text"}).pipe(tap(x => x, x => this.decrement(), () => this.decrement())).toPromise();
  }

  getObservable(url: string, responseType: "json" | "text" | "blob" | "arraybuffer" = "json"): Observable<Object> {
    this.increment();
    return responseType == "json" ? this.http.get(url).pipe(tap(x => x, x => this.decrement(), () => this.decrement()))
      : (responseType === "text" ? this.http.get(url, {responseType:"text"}).pipe(tap(x => x, x => this.decrement(), () => this.decrement()))
      : (responseType === "blob" ? this.http.get(url, {responseType:"blob"}).pipe(tap(x => x, x => this.decrement(), () => this.decrement()))
      : this.http.get(url, {responseType:"arraybuffer"}).pipe(tap(x => x, x => this.decrement(), () => this.decrement()))));
  }

  postObservable(url: string, body: any, responseType: "json" | "text" = "json"): Observable<Object> {
    this.increment();
    const headers = new HttpHeaders().set("Content-Type", "application/json");
    return responseType == "json" ? this.http.post(url, body, {headers}).pipe(tap(x => x, x => this.decrement(), () => this.decrement()))
      : this.http.post(url, body, {headers, responseType:"text"}).pipe(tap(x => x, x => this.decrement(), () => this.decrement()));
  }

  putObservable(url: string, body: any, responseType: "json" | "text" = "json"): Observable<Object> {
    this.increment();
    const headers = new HttpHeaders().set("Content-Type", "application/json");
    return responseType == "json" ? this.http.put(url, body, {headers}).pipe(tap(x => x, x => this.decrement(), () => this.decrement()))
      : this.http.put(url, body, {headers, responseType:"text"}).pipe(tap(x => x, x => this.decrement(), () => this.decrement()));
  }

  deleteObservable(url: string, responseType: "json" | "text" = "json"): Observable<Object> {
    this.increment();
    return responseType == "json" ? this.http.delete(url).pipe(tap(x => x, x => this.decrement(), () => this.decrement()))
      : this.http.delete(url, {responseType:"text"}).pipe(tap(x => x, x => this.decrement(), () => this.decrement()));
  }

  decrement(skipLoading: boolean = false) {
    if(!skipLoading) {
      this.requests--;
      if(this.requests == 0) {
        this.subscription.unsubscribe();
        this.running = false;
        this.tick = 0;
      }
      this.loading.emit(this.requests > 0);
    }
  }

  increment() {
    if(this.requests === 0) {
      this.running = true;
      this.subscription = this.timer.subscribe((seconds) => {
        this.tick++;
      });
    }
    this.requests++;
    this.loading.emit(true);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}