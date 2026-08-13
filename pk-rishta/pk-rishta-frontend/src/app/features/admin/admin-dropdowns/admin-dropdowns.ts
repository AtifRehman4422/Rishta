import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AdminService, DropdownOption, DropdownOptionRequest } from '../../../core/services/admin.service';

const FIELD_OPTIONS = [
  { key: 'caste', label: 'Caste' },
  { key: 'education', label: 'Education' },
  { key: 'profession', label: 'Profession' },
  { key: 'language', label: 'Language' },
  { key: 'state', label: 'State / Province' },
  { key: 'city', label: 'City' },
  { key: 'country', label: 'Country' },
  { key: 'religion', label: 'Religion' },
  { key: 'sect', label: 'Sect / Denomination' },
  { key: 'color', label: 'Color' },
  { key: 'marital_status', label: 'Marital Status' },
  { key: 'guardian_type', label: 'Guardian' },
  { key: 'house_type', label: 'House Type' },
  { key: 'disability', label: 'Disability' },
] as const;

const PROFESSION_CATEGORIES = [
  'Government Job',
  'Private Job',
  'Business / Self-Employed',
] as const;

@Component({
  selector: 'app-admin-dropdowns',
  imports: [FormsModule],
  template: `
    <div class="admin-page">
      <h1>Dropdown Options</h1>
      <p class="page-hint">
        Select a dropdown field → complete list loads as labels → Add / Edit / Delete any value.
      </p>

      <div class="tabs">
        <button type="button" class="tab" [class.active]="tab() === 'options'" (click)="setTab('options')">Manage Lists</button>
        <button type="button" class="tab" [class.active]="tab() === 'requests'" (click)="setTab('requests')">
          User Requests
          @if (pendingCount() > 0) {
            <span class="count">{{ pendingCount() }}</span>
          }
        </button>
      </div>

      @if (message()) {
        <div class="banner" [class.error]="messageType() === 'error'">{{ message() }}</div>
      }

      @if (tab() === 'options') {
        <div class="toolbar card">
          <label class="form-label">All dropdown fields</label>
          <div class="field-chips">
            @for (f of fields; track f.key) {
              <button
                type="button"
                class="field-chip"
                [class.active]="selectedField === f.key"
                (click)="selectField(f.key)"
              >{{ f.label }}</button>
            }
          </div>

          <div class="selected-row">
            <h2 class="selected-title">{{ selectedFieldLabel }}</h2>
            <button type="button" class="btn btn-outline btn-sm" (click)="seedBuiltins()" [disabled]="saving()">
              {{ saving() ? 'Loading...' : 'Load complete list' }}
            </button>
          </div>

          <div class="form-row filters">
            @if (selectedField === 'profession') {
              <div class="form-group">
                <label class="form-label">Category</label>
                <select class="form-select" [(ngModel)]="filterCategory">
                  <option value="">All</option>
                  @for (c of professionCategories; track c) {
                    <option [value]="c">{{ c }}</option>
                  }
                </select>
              </div>
            }
            @if (selectedField === 'language') {
              <div class="form-group">
                <label class="form-label">Category</label>
                <select class="form-select" [(ngModel)]="filterCategory">
                  <option value="">All</option>
                  <option value="Pakistan">Pakistan</option>
                  <option value="International">International</option>
                </select>
              </div>
            }
            @if (selectedField === 'city') {
              <div class="form-group">
                <label class="form-label">Province</label>
                <select class="form-select" [(ngModel)]="filterCategory">
                  <option value="">All</option>
                  @for (p of cityProvinces; track p) {
                    <option [value]="p">{{ p }}</option>
                  }
                </select>
              </div>
            }
            @if (selectedField === 'sect') {
              <div class="form-group">
                <label class="form-label">Religion</label>
                <select class="form-select" [(ngModel)]="filterCategory">
                  <option value="">All</option>
                  @for (r of religionCategories; track r) {
                    <option [value]="r">{{ r }}</option>
                  }
                </select>
              </div>
            }
            <div class="form-group grow">
              <label class="form-label">Search label</label>
              <input class="form-input" [(ngModel)]="searchText" placeholder="Search..." />
            </div>
          </div>

          <div class="add-box">
            <h3>Add new label</h3>
            <div class="form-row">
              @if (needsCategory) {
                <div class="form-group">
                  <label class="form-label">Category</label>
                  <select class="form-select" [(ngModel)]="newCategory">
                    @for (c of categoryChoices; track c) {
                      <option [value]="c">{{ c }}</option>
                    }
                  </select>
                </div>
              }
              <div class="form-group grow">
                <label class="form-label">Label</label>
                <input class="form-input" [(ngModel)]="newLabel" [placeholder]="'New ' + selectedFieldLabel + ' value'" (keyup.enter)="addOption()" />
              </div>
              <div class="form-group btn-wrap">
                <button type="button" class="btn btn-primary" (click)="addOption()" [disabled]="saving()">Add</button>
              </div>
            </div>
          </div>
        </div>

        <p class="list-count">
          {{ selectedFieldLabel }} — {{ filteredOptions().length }} label(s)
          @if (filteredOptions().length !== options().length) {
            <span>(filtered from {{ options().length }})</span>
          }
        </p>

        @if (loadingOptions()) {
          <div class="loading-center"><div class="spinner"></div></div>
        } @else if (!options().length) {
          <div class="empty card">
            <p>No labels loaded for <strong>{{ selectedFieldLabel }}</strong>.</p>
            <button type="button" class="btn btn-primary" (click)="seedBuiltins()">Load complete list</button>
          </div>
        } @else if (!filteredOptions().length) {
          <div class="empty card">No labels match your search / filter.</div>
        } @else {
          <div class="label-table card">
            <div class="table-head">
              <span class="col-label">Label</span>
              <span class="col-cat">Category</span>
              <span class="col-actions">Actions</span>
            </div>
            @for (opt of filteredOptions(); track opt.id) {
              <div class="table-row" [class.inactive]="!opt.is_active">
                @if (editingId() === opt.id) {
                  <div class="edit-row full">
                    @if (needsCategory) {
                      <select class="form-select" [(ngModel)]="editCategory">
                        @for (c of categoryChoices; track c) {
                          <option [value]="c">{{ c }}</option>
                        }
                      </select>
                    }
                    <input class="form-input" [(ngModel)]="editLabel" />
                    <button type="button" class="btn btn-primary btn-sm" (click)="saveEdit(opt)" [disabled]="saving()">Save</button>
                    <button type="button" class="btn btn-outline btn-sm" (click)="cancelEdit()">Cancel</button>
                  </div>
                } @else {
                  <span class="col-label"><strong>{{ displayLabel(opt) }}</strong></span>
                  <span class="col-cat">{{ opt.category || '—' }}</span>
                  <span class="col-actions">
                    @if (!opt.is_active) { <span class="badge">Inactive</span> }
                    <button type="button" class="btn btn-outline btn-sm" (click)="startEdit(opt)">Edit</button>
                    <button type="button" class="btn btn-outline btn-sm" (click)="toggleActive(opt)">
                      {{ opt.is_active ? 'Disable' : 'Enable' }}
                    </button>
                    <button type="button" class="btn btn-danger btn-sm" (click)="deleteOption(opt)">Delete</button>
                  </span>
                }
              </div>
            }
          </div>
        }
      } @else {
        <div class="toolbar card">
          <select class="form-select" [(ngModel)]="requestStatus" (ngModelChange)="loadRequests()">
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>
          <button type="button" class="btn btn-outline btn-sm" (click)="loadRequests()">Refresh</button>
        </div>

        @if (loadingRequests()) {
          <div class="loading-center"><div class="spinner"></div></div>
        } @else if (!requests().length) {
          <div class="empty card">No user requests found.</div>
        } @else {
          <div class="request-list">
            @for (req of requests(); track req.id) {
              <div class="request-card card">
                <div class="request-head">
                  <span class="badge" [class]="'st-' + req.status">{{ req.status }}</span>
                  <strong>{{ fieldLabel(req.field_key) }}</strong>
                  @if (req.category) {
                    <span class="meta">{{ req.category }}</span>
                  }
                  <span class="date">{{ formatDate(req.created_at) }}</span>
                </div>
                <p class="requested"><span>Requested:</span> {{ req.requested_label }}</p>
                <p class="sender">{{ req.requester_name || 'User' }} · {{ req.requester_email }}</p>
                @if (req.status === 'pending') {
                  <div class="actions">
                    <button type="button" class="btn btn-primary btn-sm" (click)="review(req, 'approve')" [disabled]="saving()">
                      Approve &amp; Add to list
                    </button>
                    <button type="button" class="btn btn-outline btn-sm" (click)="review(req, 'reject')" [disabled]="saving()">
                      Reject
                    </button>
                  </div>
                }
              </div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .admin-page { max-width: 980px; }
    .page-hint { color: var(--text-muted); margin-bottom: 1.25rem; }
    .tabs { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
    .tab {
      border: 1.5px solid var(--border);
      background: #fff;
      border-radius: 999px;
      padding: 0.45rem 1rem;
      font-weight: 700;
      cursor: pointer;
    }
    .tab.active { border-color: var(--primary); color: var(--primary); background: rgba(155, 27, 48, 0.06); }
    .count {
      margin-left: 0.35rem;
      background: var(--primary);
      color: #fff;
      border-radius: 999px;
      padding: 0.05rem 0.45rem;
      font-size: 0.75rem;
    }
    .banner {
      padding: 0.75rem 1rem;
      border-radius: 8px;
      background: #dcfce7;
      color: #15803d;
      margin-bottom: 1rem;
      font-weight: 600;
    }
    .banner.error { background: #fee2e2; color: #b91c1c; }
    .toolbar { padding: 1.1rem 1.25rem; margin-bottom: 1rem; }
    .field-chips { display: flex; flex-wrap: wrap; gap: 0.45rem; margin: 0.5rem 0 1rem; }
    .field-chip {
      border: 1.5px solid var(--border);
      background: #fff;
      border-radius: 999px;
      padding: 0.4rem 0.85rem;
      font-size: 0.86rem;
      font-weight: 600;
      cursor: pointer;
    }
    .field-chip.active {
      border-color: var(--primary);
      background: rgba(155, 27, 48, 0.08);
      color: var(--primary);
    }
    .selected-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 0.85rem;
      padding-bottom: 0.85rem;
      border-bottom: 1px solid var(--border);
    }
    .selected-title { margin: 0; font-size: 1.15rem; color: var(--primary); }
    .form-row, .filters { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: end; }
    .form-group { display: flex; flex-direction: column; gap: 0.35rem; min-width: 160px; }
    .form-group.grow { flex: 1; }
    .form-label { font-size: 0.82rem; font-weight: 700; }
    .add-box { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border); }
    .add-box h3 { margin: 0 0 0.75rem; font-size: 1rem; }
    .list-count { margin: 0 0 0.75rem; font-size: 0.9rem; color: var(--text-muted); font-weight: 600; }
    .btn-wrap { justify-content: flex-end; }
    .label-table { padding: 0; overflow: hidden; }
    .table-head, .table-row {
      display: grid;
      grid-template-columns: minmax(140px, 1.4fr) minmax(100px, 0.9fr) auto;
      gap: 0.75rem;
      align-items: center;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border);
    }
    .table-head {
      background: rgba(155, 27, 48, 0.05);
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--text-muted);
    }
    .table-row.inactive { opacity: 0.55; }
    .table-row:last-child { border-bottom: none; }
    .col-actions { display: flex; flex-wrap: wrap; gap: 0.4rem; justify-content: flex-end; }
    .edit-row.full {
      grid-column: 1 / -1;
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
    }
    .edit-row.full .form-input { flex: 1; min-width: 160px; }
    .meta { color: var(--text-muted); font-size: 0.85rem; margin-left: 0.5rem; }
    .badge {
      font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
      padding: 0.15rem 0.5rem; border-radius: 999px; background: #f3f4f6; color: #6b7280;
    }
    .st-pending { background: #dbeafe; color: #1d4ed8; }
    .st-approved { background: #dcfce7; color: #15803d; }
    .st-rejected { background: #fee2e2; color: #b91c1c; }
    .request-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .request-card { padding: 1rem 1.15rem; }
    .request-head, .actions { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
    .date { margin-left: auto; font-size: 0.82rem; color: var(--text-muted); }
    .requested { margin: 0.65rem 0 0.25rem; }
    .requested span { color: var(--text-muted); }
    .sender { margin: 0 0 0.75rem; color: var(--text-muted); font-size: 0.9rem; }
    .empty { text-align: center; padding: 2.5rem; color: var(--text-muted); }
    .empty .btn { margin-top: 0.85rem; }
    .btn-danger {
      border: 1.5px solid #b91c1c;
      color: #b91c1c;
      background: #fff;
      border-radius: 8px;
      padding: 0.35rem 0.7rem;
      cursor: pointer;
      font-weight: 600;
    }
    @media (max-width: 700px) {
      .table-head { display: none; }
      .table-row {
        grid-template-columns: 1fr;
        gap: 0.4rem;
      }
      .col-actions { justify-content: flex-start; }
    }
  `],
})
export class AdminDropdownsComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly fields = FIELD_OPTIONS;
  readonly professionCategories = PROFESSION_CATEGORIES;
  readonly cityProvinces = [
    'Punjab', 'Sindh', 'KPK', 'Balochistan', 'Islamabad', 'Gilgit-Baltistan', 'AJK',
  ];
  readonly languageCategories = ['Pakistan', 'International'];
  readonly religionCategories = ['Islam', 'Christianity', 'Hinduism', 'Other'];

  private readonly maritalLabels: Record<string, string> = {
    never_married: 'Single',
    divorced: 'Divorced',
    widowed: 'Widowed',
    separated: 'Separated',
  };

  tab = signal<'options' | 'requests'>('options');
  options = signal<DropdownOption[]>([]);
  requests = signal<DropdownOptionRequest[]>([]);
  loadingOptions = signal(false);
  loadingRequests = signal(false);
  saving = signal(false);
  editingId = signal<string | null>(null);
  pendingCount = signal(0);
  message = signal('');
  messageType = signal<'success' | 'error'>('success');

  selectedField = 'caste';
  filterCategory = '';
  searchText = '';
  newLabel = '';
  newCategory = 'Private Job';
  editLabel = '';
  editCategory = '';
  requestStatus = 'pending';

  get selectedFieldLabel(): string {
    return this.fieldLabel(this.selectedField);
  }

  get needsCategory(): boolean {
    return ['profession', 'city', 'language', 'sect'].includes(this.selectedField);
  }

  get categoryChoices(): string[] {
    if (this.selectedField === 'profession') return [...this.professionCategories];
    if (this.selectedField === 'city') return this.cityProvinces;
    if (this.selectedField === 'language') return this.languageCategories;
    if (this.selectedField === 'sect') return this.religionCategories;
    return [];
  }

  ngOnInit(): void {
    this.selectField('caste');
    this.loadRequests();
  }

  setTab(tab: 'options' | 'requests'): void {
    this.tab.set(tab);
    if (tab === 'requests') this.loadRequests();
    if (tab === 'options') this.loadOptions(true);
  }

  selectField(key: string): void {
    this.selectedField = key;
    this.filterCategory = '';
    this.searchText = '';
    this.editingId.set(null);
    if (key === 'profession') this.newCategory = 'Private Job';
    else if (key === 'city') this.newCategory = 'Punjab';
    else if (key === 'language') this.newCategory = 'Pakistan';
    else if (key === 'sect') this.newCategory = 'Islam';
    this.loadOptions(true);
  }

  filteredOptions(): DropdownOption[] {
    let list = this.options();
    if (this.filterCategory) {
      list = list.filter((o) => o.category === this.filterCategory);
    }
    const q = this.searchText.trim().toLowerCase();
    if (q) {
      list = list.filter((o) =>
        this.displayLabel(o).toLowerCase().includes(q)
        || (o.category || '').toLowerCase().includes(q)
      );
    }
    return list;
  }

  displayLabel(opt: DropdownOption): string {
    if (opt.field_key === 'marital_status') {
      return this.maritalLabels[opt.label] || opt.label;
    }
    if (opt.field_key === 'house_type') {
      return opt.label === 'own' ? 'Own' : opt.label === 'rent' ? 'Rent' : opt.label;
    }
    return opt.label;
  }

  fieldLabel(key: string): string {
    return this.fields.find((f) => f.key === key)?.label || key;
  }

  loadOptions(autoSeedIfEmpty = false): void {
    this.loadingOptions.set(true);
    this.adminService.getDropdownOptions(this.selectedField).subscribe({
      next: (res) => {
        const rows = res.data || [];
        this.options.set(rows);
        this.loadingOptions.set(false);
        if (autoSeedIfEmpty && !rows.length) {
          this.seedBuiltins(true);
        }
      },
      error: () => {
        this.loadingOptions.set(false);
        this.flash('Failed to load options', 'error');
      },
    });
  }

  seedBuiltins(silent = false): void {
    this.saving.set(true);
    this.adminService.seedDropdownOptions().subscribe({
      next: (res) => {
        this.saving.set(false);
        if (!silent) {
          this.flash(res.message || `Complete list loaded (added ${res.data?.inserted ?? 0})`);
        }
        this.loadOptions(false);
      },
      error: (err) => {
        this.saving.set(false);
        this.flash(err.error?.message || 'Failed to load complete list', 'error');
      },
    });
  }

  loadRequests(): void {
    this.loadingRequests.set(true);
    this.adminService.getDropdownRequests(this.requestStatus).subscribe({
      next: (res) => {
        this.requests.set(res.data || []);
        this.loadingRequests.set(false);
        if (this.requestStatus === 'pending') {
          this.pendingCount.set(res.data?.length || 0);
        } else {
          this.adminService.getDropdownRequests('pending').subscribe({
            next: (p) => this.pendingCount.set(p.data?.length || 0),
          });
        }
      },
      error: () => {
        this.loadingRequests.set(false);
        this.flash('Failed to load requests', 'error');
      },
    });
  }

  addOption(): void {
    const label = this.newLabel.trim();
    if (label.length < 1) {
      this.flash('Enter a label', 'error');
      return;
    }
    if (this.needsCategory && !this.newCategory) {
      this.flash('Select a category', 'error');
      return;
    }
    this.saving.set(true);
    this.adminService.createDropdownOption({
      field_key: this.selectedField,
      label,
      category: this.needsCategory ? this.newCategory : undefined,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.newLabel = '';
        this.flash('Label added');
        this.loadOptions(false);
      },
      error: (err) => {
        this.saving.set(false);
        this.flash(err.error?.message || 'Failed to add', 'error');
      },
    });
  }

  startEdit(opt: DropdownOption): void {
    this.editingId.set(opt.id);
    this.editLabel = opt.label;
    this.editCategory = opt.category || this.newCategory;
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  saveEdit(opt: DropdownOption): void {
    const label = this.editLabel.trim();
    if (label.length < 1) {
      this.flash('Enter a label', 'error');
      return;
    }
    this.saving.set(true);
    this.adminService.updateDropdownOption(opt.id, {
      label,
      category: this.needsCategory ? this.editCategory : opt.category,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.editingId.set(null);
        this.flash('Label updated');
        this.loadOptions(false);
      },
      error: (err) => {
        this.saving.set(false);
        this.flash(err.error?.message || 'Failed to update', 'error');
      },
    });
  }

  toggleActive(opt: DropdownOption): void {
    this.saving.set(true);
    this.adminService.updateDropdownOption(opt.id, { is_active: !opt.is_active }).subscribe({
      next: () => {
        this.saving.set(false);
        this.flash(opt.is_active ? 'Label disabled' : 'Label enabled');
        this.loadOptions(false);
      },
      error: (err) => {
        this.saving.set(false);
        this.flash(err.error?.message || 'Failed to update', 'error');
      },
    });
  }

  deleteOption(opt: DropdownOption): void {
    if (!confirm(`Delete label "${this.displayLabel(opt)}"?`)) return;
    this.saving.set(true);
    this.adminService.deleteDropdownOption(opt.id).subscribe({
      next: () => {
        this.saving.set(false);
        this.flash('Label deleted');
        this.loadOptions(false);
      },
      error: (err) => {
        this.saving.set(false);
        this.flash(err.error?.message || 'Failed to delete', 'error');
      },
    });
  }

  review(req: DropdownOptionRequest, action: 'approve' | 'reject'): void {
    this.saving.set(true);
    this.adminService.reviewDropdownRequest(req.id, action).subscribe({
      next: () => {
        this.saving.set(false);
        this.flash(action === 'approve'
          ? 'Request approved and label added'
          : 'Request rejected');
        this.loadRequests();
        if (action === 'approve') this.loadOptions(false);
      },
      error: (err) => {
        this.saving.set(false);
        this.flash(err.error?.message || 'Failed to review request', 'error');
      },
    });
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('en-PK', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  private flash(text: string, type: 'success' | 'error' = 'success'): void {
    this.message.set(text);
    this.messageType.set(type);
  }
}
