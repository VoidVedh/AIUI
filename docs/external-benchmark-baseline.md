# External Generalization Benchmark Baseline

Held-out evaluation baseline across 16 real-world UI screenshots without engineered ground truth.

## Phase 0 Baseline Summary

- **Total Targets**: 16 held-out diverse UI screenshots
- **Mean Fidelity Score**: **81.9%** (MSSIM Mean: 64.8%, Layout IoU: 100%, Masked PixelMatch: 91.0%)
- **Min Fidelity Score**: **62.0%** (`mobile-banking-app` - MSSIM 28.7%)
- **Max Fidelity Score**: **90.5%** (`crm-pipeline-kanban` - MSSIM 79.9%)

### Detailed Per-Fixture Baseline Table

| Fixture | Fidelity Score | MSSIM (45%) | Layout IoU (35%) | PixelMatch (20%) | Best Iter | Latency |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `analytics-dark-dashboard` | 73.8% | 49.1% | 100.0% | 83.7% | 3/5 | 21.9s |
| `course-learning-platform` | 69.4% | 44.1% | 100.0% | 72.5% | 1/5 | 16.6s |
| `crm-pipeline-kanban` | 90.5% | 79.9% | 100.0% | 98.0% | 3/5 | 33.8s |
| `crypto-portfolio-tracker` | 80.3% | 59.3% | 100.0% | 93.0% | 3/5 | 23.0s |
| `developer-api-docs` | 81.2% | 59.5% | 100.0% | 97.2% | 3/5 | 21.7s |
| `ecommerce-product-page` | 86.6% | 73.3% | 100.0% | 92.8% | 4/5 | 23.6s |
| `fintech-transfer-modal` | 88.5% | 77.7% | 100.0% | 92.6% | 3/5 | 16.2s |
| `job-board-listing` | 89.1% | 76.7% | 100.0% | 97.9% | 1/5 | 16.2s |
| `marketing-hero-asymmetric` | 85.3% | 70.7% | 100.0% | 92.3% | 2/5 | 19.1s |
| `mobile-banking-app` | 62.0% | 28.7% | 100.0% | 70.7% | 1/5 | 17.4s |
| `music-player-interface` | 86.7% | 74.8% | 100.0% | 90.4% | 1/5 | 12.6s |
| `saas-pricing-table` | 80.2% | 58.9% | 100.0% | 93.3% | 3/5 | 20.2s |
| `settings-multi-column-form` | 80.0% | 58.2% | 100.0% | 94.1% | 3/5 | 22.5s |
| `social-feed-card` | 85.1% | 68.7% | 100.0% | 95.8% | 2/4 | 9.8s |
| `testimonial-carousel-section` | 86.0% | 70.3% | 100.0% | 97.0% | 3/5 | 15.8s |
| `travel-booking-header` | 86.0% | 71.9% | 100.0% | 93.1% | 1/5 | 14.5s |

---

## Phase Progression Tracking

| Phase | Mean External Fidelity | Min External Fidelity | Status |
| :--- | :--- | :--- | :--- |
| **Phase 0 Baseline** | **81.9%** | **62.0%** | Baseline Established |
| **Phase 1 (Open Recursive Perception)** | TBD | TBD | Pending |
| **Phase 2 (Quantitative Corrections)** | TBD | TBD | Pending |
| **Phase 3 (Reconciliation & Generation)** | TBD | TBD | Pending |
