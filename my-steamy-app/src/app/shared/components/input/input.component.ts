import { Component, Output, EventEmitter, OnDestroy } from '@angular/core';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

@Component({
  selector: 'app-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss'],
  standalone: false
})
export class InputComponent implements OnDestroy {
  @Output() searchChange = new EventEmitter<string>();

  searchValue = '';
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor() {
    this.searchSubject.pipe(
      debounceTime(450),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(value => {
      this.searchChange.emit(value);
    });
  }

  onInput(event: any) {
    const value = event.detail?.value ?? event.target?.value ?? '';
    this.searchValue = value;
    this.searchSubject.next(value.trim());
  }

  clearSearch() {
    this.searchValue = '';
    this.searchSubject.next('');
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}