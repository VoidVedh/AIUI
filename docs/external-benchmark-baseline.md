# External Generalization Benchmark Baseline

Held-out evaluation baseline across 16 real-world UI screenshots without engineered ground truth.

## Phase Tracking Summary

| Phase | Mean External Fidelity | Min External Fidelity | Max External Fidelity | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 0 Baseline (Closed Templates)** | **81.9%** | **62.0%** | **90.5%** | Baseline Recorded |
| **Phase 1 (Open Recursive Perception)** | **86.1%** (+4.2%) | **71.1%** (+9.1%) | **95.0%** | Completed |
| **Phase 2 (Quantitative Corrections & Best-of-N)** | **86.7%** (+4.8%) | **71.8%** (+9.8%) | **95.0%** | Completed & Verified |
| **Phase 3 (Reconciliation & Generation)** | TBD | TBD | TBD | In Progress |

---

## Detailed Per-Fixture Scores

### Phase 2 Results (Quantitative Corrections & Best-of-N Pipeline)

| Fixture | Fidelity Score | MSSIM (45%) | Layout IoU (35%) | PixelMatch (20%) | Best Iter | Latency |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `analytics-dark-dashboard` | **83.6%** | 64.4% | 100.0% | 98.1% | 1/5 | 20.6s |
| `course-learning-platform` | **76.9%** | 49.1% | 100.0% | 98.7% | 3/5 | 20.6s |
| `crm-pipeline-kanban` | **92.2%** | 83.3% | 100.0% | 98.4% | 2/2 | 14.8s |
| `crypto-portfolio-tracker` | **85.2%** | 68.3% | 100.0% | 97.4% | 2/5 | 19.1s |
| `developer-api-docs` | **88.8%** | 75.6% | 100.0% | 98.7% | 2/5 | 20.9s |
| `ecommerce-product-page` | **89.8%** | 79.1% | 100.0% | 96.3% | 1/5 | 23.2s |
| `fintech-transfer-modal` | **93.1%** | 85.7% | 100.0% | 97.8% | 1/1 | 21.1s |
| `job-board-listing` | **89.9%** | 78.4% | 100.0% | 98.2% | 1/5 | 23.4s |
| `marketing-hero-asymmetric` | **86.9%** | 72.8% | 100.0% | 95.6% | 2/5 | 22.7s |
| `mobile-banking-app` | **71.8%** | 43.7% | 100.0% | 85.5% | 3/5 | 8.9s |
| `music-player-interface` | **82.4%** | 85.9% | 70.7% | 95.0% | 4/5 | 19.8s |
| `saas-pricing-table` | **78.5%** | 54.0% | 100.0% | 95.9% | 1/5 | 27.7s |
| `settings-multi-column-form` | **93.3%** | 85.9% | 100.0% | 98.3% | 1/1 | 14.0s |
| `social-feed-card` | **95.0%** | 89.1% | 100.0% | 99.4% | 1/1 | 16.0s |
| `testimonial-carousel-section` | **90.6%** | 80.1% | 100.0% | 97.9% | 1/3 | 17.3s |
| `travel-booking-header` | **89.2%** | 84.4% | 90.7% | 97.4% | 3/5 | 28.0s |
