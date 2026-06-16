import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuService } from '../menu.service';
import { MenuItem } from '../menu.models';

@Component({
  selector: 'app-menu-browse',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu-browse.component.html',
  styleUrl: './menu-browse.component.css',
})
export class MenuBrowseComponent implements OnInit {

  items: MenuItem[] = [];
  activeFilter = 'ALL';

  constructor(private menuService: MenuService) {}

  ngOnInit(): void {
    this.loadToday();
  }

  loadToday(): void {
    this.activeFilter = 'ALL';
    this.menuService.getTodaysMenu().subscribe(data => this.items = data);
  }

  onSearch(event: Event): void {
    const term = (event.target as HTMLInputElement).value;
    if (term.trim()) {
      this.menuService.search(term).subscribe(data => this.items = data);
    } else {
      this.loadToday();
    }
  }

  applyFilter(type: string): void {
    this.activeFilter = type;
    if (type === 'ALL') {
      this.loadToday();
    } else {
      this.menuService.filterByFoodType(type).subscribe(data => this.items = data);
    }
  }

  trackByItemId(index: number, item: MenuItem): number {
    return item.id;
  }
}

