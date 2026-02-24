"""Generate fig7 (AI Ensemble) and fig8 (Manipulation Trap) diagrams."""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import numpy as np

# ── Shared style ──
BG = '#FAFBFC'
BLUE = '#2563EB'
GREEN = '#059669'
RED = '#DC2626'
AMBER = '#D97706'
PURPLE = '#7C3AED'
GRAY = '#64748B'
DARK = '#1E293B'
LIGHT = '#F1F5F9'

def rounded_box(ax, x, y, w, h, color, text, fontsize=10, textcolor='white', alpha=1.0):
    """Draw a rounded box with centered text."""
    box = FancyBboxPatch((x, y), w, h,
                          boxstyle="round,pad=0.02",
                          facecolor=color, edgecolor='white',
                          linewidth=1.5, alpha=alpha)
    ax.add_patch(box)
    ax.text(x + w/2, y + h/2, text,
            ha='center', va='center', fontsize=fontsize,
            fontweight='bold', color=textcolor, family='sans-serif')

def arrow(ax, x1, y1, x2, y2, color=GRAY, lw=1.5, style='->', head_width=0.012):
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle=style, color=color, lw=lw))


# ═════════════════════════════════════════════════
# Figure 7: AI Ensemble Flow
# ═════════════════════════════════════════════════
fig, ax = plt.subplots(figsize=(8, 5), facecolor=BG)
ax.set_xlim(0, 1)
ax.set_ylim(0, 1)
ax.axis('off')
ax.set_facecolor(BG)

# Input: Curated Evidence
rounded_box(ax, 0.02, 0.75, 0.22, 0.12, BLUE, 'Curated\nEvidence E\'', 11)

# Models
model_colors = ['#6366F1', '#2563EB', '#0891B2', '#7C3AED']
model_labels = ['Claude', 'GPT', 'Gemini', 'Domain AI']
model_verdicts = ['NO (0.82)', 'NO (0.78)', 'YES (0.45)', 'NO (0.85)']
model_ys = [0.87, 0.67, 0.47, 0.27]

for i, (label, verdict, ypos, color) in enumerate(zip(model_labels, model_verdicts, model_ys, model_colors)):
    rounded_box(ax, 0.32, ypos, 0.18, 0.10, color, f'{label}', 10)
    ax.text(0.51, ypos + 0.05, verdict, ha='left', va='center',
            fontsize=8, color=DARK, family='monospace', style='italic')
    # Arrow from evidence to model
    arrow(ax, 0.24, 0.81, 0.32, ypos + 0.05, color=BLUE, lw=1.2)

# Cross-Model Consensus box
rounded_box(ax, 0.60, 0.60, 0.18, 0.12, DARK, 'Cross-Model\nConsensus', 10)

# Arrows from models to consensus
for ypos in model_ys:
    arrow(ax, 0.50, ypos + 0.05, 0.60, 0.66, color=GRAY, lw=1.0)

# IMA Score
rounded_box(ax, 0.60, 0.38, 0.18, 0.10, AMBER, 'IMA = 0.62', 11)
arrow(ax, 0.69, 0.60, 0.69, 0.48, color=DARK, lw=1.5)

# Branch: Majority → Proposer
rounded_box(ax, 0.82, 0.72, 0.16, 0.10, GREEN, 'Proposer\n(Majority)', 9)
arrow(ax, 0.78, 0.69, 0.82, 0.77, color=GREEN, lw=1.2)

# Branch: Minority → Challenger
rounded_box(ax, 0.82, 0.52, 0.16, 0.10, RED, 'Challenger\n(Minority)', 9)
arrow(ax, 0.78, 0.63, 0.82, 0.57, color=RED, lw=1.2)

# Decision outcomes
rounded_box(ax, 0.60, 0.12, 0.16, 0.12, GREEN, 'AUTO', 14)
rounded_box(ax, 0.82, 0.12, 0.16, 0.12, AMBER, 'HOLD', 14)

# Arrows from IMA to outcomes
ax.annotate('IMA ≥ 0.50', xy=(0.64, 0.24), xytext=(0.64, 0.38),
            arrowprops=dict(arrowstyle='->', color=GREEN, lw=1.5),
            ha='center', fontsize=8, color=GREEN, fontweight='bold')
ax.annotate('IMA < 0.50', xy=(0.86, 0.24), xytext=(0.74, 0.38),
            arrowprops=dict(arrowstyle='->', color=AMBER, lw=1.5),
            ha='center', fontsize=8, color=AMBER, fontweight='bold')

# Title annotation
ax.text(0.50, 0.97, 'Multi-Model AI Ensemble', ha='center', va='top',
        fontsize=13, fontweight='bold', color=DARK, family='sans-serif')

plt.tight_layout(pad=0.3)
fig.savefig('/Users/macmini/workspace/chainlink-convergence-2026/whitepaper/diagrams/fig7_ai_ensemble.png',
            dpi=300, bbox_inches='tight', facecolor=BG)
plt.close()
print("✅ fig7_ai_ensemble.png saved")


# ═════════════════════════════════════════════════
# Figure 8: Manipulation Trap
# ═════════════════════════════════════════════════
fig, ax = plt.subplots(figsize=(8, 5), facecolor=BG)
ax.set_xlim(0, 1)
ax.set_ylim(0, 1)
ax.axis('off')
ax.set_facecolor(BG)

# Left path: attacker removes source
rounded_box(ax, 0.02, 0.78, 0.22, 0.12, RED, 'Attacker\nRemoves Source', 10)

# Step 1: Source excluded
rounded_box(ax, 0.30, 0.78, 0.22, 0.12, '#EF4444', 'Source Excluded\nby Vote', 10)
arrow(ax, 0.24, 0.84, 0.30, 0.84, color=RED, lw=2)

# Step 2: Excluded metadata forwarded
rounded_box(ax, 0.58, 0.78, 0.22, 0.12, PURPLE, 'AI Receives\nExcl. Metadata', 10)
arrow(ax, 0.52, 0.84, 0.58, 0.84, color=GRAY, lw=1.5)

# Step 3: Rule 8 check
rounded_box(ax, 0.58, 0.55, 0.22, 0.12, DARK, 'Rule 8 Check:\nRestore → Flip?', 10)
arrow(ax, 0.69, 0.78, 0.69, 0.67, color=PURPLE, lw=1.5)

# YES → HOLD
rounded_box(ax, 0.82, 0.40, 0.16, 0.10, AMBER, 'HOLD', 14)
ax.annotate('YES\n(verdict flips)', xy=(0.86, 0.50), xytext=(0.80, 0.63),
            arrowprops=dict(arrowstyle='->', color=AMBER, lw=2),
            ha='center', fontsize=9, color=AMBER, fontweight='bold')

# NO → Safe (but original evidence was unfavorable anyway)
rounded_box(ax, 0.34, 0.40, 0.20, 0.10, GREEN, 'No Flip\n(removal harmless)', 9, textcolor='white')
ax.annotate('NO', xy=(0.48, 0.50), xytext=(0.63, 0.55),
            arrowprops=dict(arrowstyle='->', color=GREEN, lw=1.5),
            ha='center', fontsize=9, color=GREEN, fontweight='bold')

# Right path: attacker keeps source
rounded_box(ax, 0.02, 0.20, 0.22, 0.12, BLUE, 'Attacker Keeps\nAll Sources', 10)
rounded_box(ax, 0.30, 0.20, 0.22, 0.12, GREEN, 'Evidence\nReflects Truth', 10)
arrow(ax, 0.24, 0.26, 0.30, 0.26, color=BLUE, lw=2)

# Both paths converge to result
rounded_box(ax, 0.60, 0.05, 0.38, 0.12, DARK, 'Manipulation Fails\nEither Way', 12)
arrow(ax, 0.52, 0.24, 0.60, 0.13, color=GREEN, lw=1.5)
arrow(ax, 0.90, 0.40, 0.85, 0.17, color=AMBER, lw=1.5)
arrow(ax, 0.44, 0.40, 0.65, 0.17, color=GREEN, lw=1.2, style='->')

# Title annotation
ax.text(0.50, 0.97, 'Manipulation Trap: Excluded Source Forensics', ha='center', va='top',
        fontsize=13, fontweight='bold', color=DARK, family='sans-serif')

# Annotation: trap summary
ax.text(0.04, 0.06, 'Whitelisted sources cannot be removed at all',
        fontsize=8, color=GRAY, style='italic', family='sans-serif')

plt.tight_layout(pad=0.3)
fig.savefig('/Users/macmini/workspace/chainlink-convergence-2026/whitepaper/diagrams/fig8_manipulation_trap.png',
            dpi=300, bbox_inches='tight', facecolor=BG)
plt.close()
print("✅ fig8_manipulation_trap.png saved")
