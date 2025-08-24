import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ChartData {
  label: string;
  value: number;
  color?: string;
}

export interface GroupedChartData {
  label: string;
  series: {
    name: string;
    value: number;
    color?: string;
  }[];
}

@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class BarChartComponent {
  @Input() data: ChartData[] = [];
  @Input() groupedData: GroupedChartData[] = [];
  @Input() title: string = '';
  @Input() height: number = 250;
  @Input() showValues: boolean = true;
  @Input() showLabels: boolean = true;
  @Input() color: string = 'var(--ion-color-success)';
  @Input() isGrouped: boolean = false;

  getMaxValue(): number {
    if (this.isGrouped) {
      const maxInGroups = this.groupedData.map(group => 
        Math.max(...group.series.map(s => s.value))
      );
      return Math.max(...maxInGroups, 1);
    }
    return Math.max(...this.data.map(d => d.value), 1);
  }

  getBarHeight(value: number): number {
    const maxValue = this.getMaxValue();
    return (value / maxValue) * 100;
  }

  getBarColor(item: ChartData): string {
    return item.color || this.color;
  }

  getSeriesColor(series: any): string {
    return series.color || this.color;
  }

  formatLabel(label: string): string {
    // Try to format as date if it looks like a date
    if (label.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return new Date(label).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
    return label;
  }

  trackByLabel(index: number, item: ChartData): string {
    return item.label;
  }
}
