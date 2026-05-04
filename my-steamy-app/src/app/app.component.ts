import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  showSplash = true;
  splashLeaving = false;

  ngOnInit(): void {
    setTimeout(() => {
      this.splashLeaving = true;

      setTimeout(() => {
        this.showSplash = false;
      }, 520);
    }, 1800);
  }
}
