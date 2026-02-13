import { Component, OnInit, OnDestroy, Inject, Optional } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface SessionWarningData {
  timeRemaining: number; // in minutes
}

@Component({
  selector: 'app-session-warning-dialog',
  templateUrl: './session-warning-dialog.component.html',
  styleUrls: ['./session-warning-dialog.component.css']
})
export class SessionWarningDialogComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  timeRemaining: number = 5;
  displayTime: string = '';

  constructor(
    @Optional() public dialogRef: MatDialogRef<SessionWarningDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: SessionWarningData
  ) {
    if (data?.timeRemaining) {
      this.timeRemaining = data.timeRemaining;
    }
  }

  ngOnInit(): void {
    this.updateDisplayTime();
    
    // Countdown timer
    interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.timeRemaining -= 1/60; // Decrease by 1 second
        this.updateDisplayTime();
        
        if (this.timeRemaining <= 0) {
          this.onLogout();
        }
      });
  }

  private updateDisplayTime(): void {
    const minutes = Math.floor(this.timeRemaining);
    const seconds = Math.floor((this.timeRemaining - minutes) * 60);
    this.displayTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  onStayLoggedIn(): void {
    if (this.dialogRef) {
      this.dialogRef.close('extend');
    }
  }

  onLogout(): void {
    if (this.dialogRef) {
      this.dialogRef.close('logout');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
