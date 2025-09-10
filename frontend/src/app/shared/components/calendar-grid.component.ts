import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-calendar-grid',
  standalone: true,
  templateUrl: './calendar-grid.component.html',
  styleUrls: ['./calendar-grid.component.scss'],
  imports: [CommonModule]
})
export class CalendarGridComponent {
  @Input() month: number = new Date().getMonth(); // 0-indexed
  @Input() year: number = new Date().getFullYear();
  @Input() events: string[] = []; // Array of ISO date strings (e.g., '2025-09-10')

  monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  get weeks(): (Date | null)[][] {
    const firstDay = new Date(this.year, this.month, 1);
    const lastDay = new Date(this.year, this.month + 1, 0);
    const weeks: (Date | null)[][] = [];
    let week: (Date | null)[] = Array(firstDay.getDay()).fill(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      week.push(new Date(this.year, this.month, d));
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }
    if (week.length) {
      while (week.length < 7) week.push(null);
      weeks.push(week);
    }
    return weeks;
  }

  isEventDay(date: Date | null): boolean {
    if (!date) return false;
    const iso = date.toISOString().slice(0, 10);
    return this.events.includes(iso);
  }

  isToday(date: Date | null): boolean {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }
}
