# External Generalization Benchmark Baseline

Held-out evaluation baseline across 16 real-world UI screenshots without engineered ground truth.

## Phase Tracking Summary

| Phase | Mean External Fidelity | Min External Fidelity | Max External Fidelity | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 0 Baseline (Closed Templates)** | **81.9%** | **62.0%** | **90.5%** | Baseline Recorded |
| **Phase 1 (Open Recursive Perception)** | **86.1%** (+4.2%) | **71.1%** (+9.1%) | **95.0%** | Completed & Verified |
| **Phase 2 (Quantitative Corrections & Best-of-N)** | TBD | TBD | TBD | Pending |
| **Phase 3 (Reconciliation & Generation)** | TBD | TBD | TBD | Pending |

---

## Detailed Per-Fixture Scores

### Phase 1 Results (Open Recursive Perception & Generic Tree-Walking)

| Fixture | Fidelity Score | MSSIM (45%) | Layout IoU (35%) | PixelMatch (20%) | Best Iter | Latency | Delta vs Phase 0 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `analytics-dark-dashboard` | **83.6%** | 64.4% | 100.0% | 98.1% | 1/5 | 21.7s | **+9.8%** |
| `course-learning-platform` | **76.9%** | 49.1% | 100.0% | 98.7% | 3/5 | 20.0s | **+7.5%** |
| `crm-pipeline-kanban` | **92.2%** | 83.3% | 100.0% | 98.4% | 2/2 | 19.1s | **+1.7%** |
| `crypto-portfolio-tracker` | **85.2%** | 68.3% | 100.0% | 97.4% | 2/5 | 9.1s | **+4.9%** |
| `developer-api-docs` | **88.8%** | 75.6% | 100.0% | 98.7% | 2/5 | 37.7s | **+7.6%** |
| `ecommerce-product-page` | **89.8%** | 79.1% | 100.0% | 96.3% | 1/5 | 23.7s | **+3.2%** |
| `fintech-transfer-modal` | **93.1%** | 85.7% | 100.0% | 97.8% | 1/1 | 21.5s | **+4.6%** |
| `job-board-listing` | **89.9%** | 78.4% | 100.0% | 98.2% | 1/5 | 20.7s | **+0.8%** |
| `marketing-hero-asymmetric` | **86.9%** | 72.8% | 100.0% | 95.6% | 2/5 | 9.6s | **+1.6%** |
| `mobile-banking-app` | **71.8%** | 43.7% | 100.0% | 85.5% | 3/5 | 18.9s | **+9.8%** |
| `music-player-interface` | **91.0%** | 86.6% | 93.9% | 96.0% | 3/5 | 20.0s | **+4.3%** |
| `saas-pricing-table` | **78.5%** | 54.0% | 100.0% | 95.9% | 1/5 | 27.3s | -1.7% |
| `settings-multi-column-form` | **93.3%** | 85.9% | 100.0% | 98.3% | 1/1 | 20.7s | **+13.3%** |
| `social-feed-card` | **95.0%** | 89.1% | 100.0% | 99.4% | 1/1 | 14.0s | **+9.9%** |
| `testimonial-carousel-section` | **90.6%** | 80.1% | 100.0% | 97.9% | 1/3 | 22.6s | **+4.6%** |
| `travel-booking-header` | **71.1%** | 85.4% | 37.7% | 97.4% | 1/5 | 21.3s | -14.9% |

### Phase 0 Baseline Table (Reference)

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
