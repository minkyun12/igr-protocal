"""
PoRE Whitepaper — Publication-quality diagrams v3
Fixes: removed in-figure titles (LaTeX captions handle it),
       increased text sizes, better contrast
"""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch
import numpy as np
import os

OUT = os.path.dirname(os.path.abspath(__file__))

plt.rcParams.update({
    'font.family': 'sans-serif',
    'font.sans-serif': ['DejaVu Sans', 'Arial'],
    'font.size': 11,
    'axes.linewidth': 0.8,
    'figure.dpi': 300,
    'savefig.dpi': 300,
    'savefig.bbox': 'tight',
    'savefig.pad_inches': 0.2,
})

C = {
    'primary': '#2563EB', 'secondary': '#7C3AED', 'accent': '#059669',
    'warning': '#D97706', 'danger': '#DC2626',
    'bg_light': '#F8FAFC', 'bg1': '#EFF6FF', 'bg2': '#F5F3FF',
    'bg3': '#ECFDF5', 'bg4': '#FFF7ED', 'bg5': '#FEF2F2',
    'border': '#94A3B8', 'text': '#1E293B', 'text_mid': '#475569',
    'white': '#FFFFFF',
}

# ── Fig 1: Architecture ──────────────────────────────────
def fig1():
    fig, ax = plt.subplots(figsize=(10, 6.5))
    ax.set_xlim(0, 10); ax.set_ylim(0, 7.5); ax.axis('off')
    fig.patch.set_facecolor(C['white'])

    layers = [
        (0.5, 'Layer 1: Evidence Collection',
         'Chainlink | Binance | Coinbase | CoinGecko | News APIs | Gov Sources',
         C['bg1'], C['primary'], 'PLUGGABLE'),
        (2.0, 'Layer 2: Source Curation',
         'Token-weighted evidence validation | Whitelisted sources | Bond mechanism',
         C['bg2'], C['secondary'], 'DECENTRALIZED'),
        (3.5, 'Layer 3: AI Deliberation',
         'Proposer: quality-weighted analysis | Challenger: adversarial pressure test',
         C['bg3'], C['accent'], 'PROBABILISTIC'),
        (5.0, 'Layer 4: Policy Engine',
         '8 deterministic gates: min_sources | deviation | confidence | freshness',
         C['bg4'], C['warning'], 'DETERMINISTIC'),
        (6.5, 'Layer 5: On-chain Recording',
         'PoreRegistry.sol | Evidence hashes | Immutable audit trail',
         C['bg5'], C['danger'], 'IMMUTABLE'),
    ]

    for y, title, desc, bg, ec, badge in layers:
        box = FancyBboxPatch((0.8, y), 8.4, 1.15, boxstyle="round,pad=0.1",
                             facecolor=bg, edgecolor=ec, linewidth=1.8)
        ax.add_patch(box)
        ax.text(1.1, y+0.78, title, fontsize=12, fontweight='bold', color=C['text'])
        ax.text(1.1, y+0.35, desc, fontsize=9, color=C['text_mid'])
        bb = FancyBboxPatch((7.3, y+0.68), 1.7, 0.35, boxstyle="round,pad=0.05",
                            facecolor=ec, edgecolor='none')
        ax.add_patch(bb)
        ax.text(8.15, y+0.855, badge, fontsize=7.5, fontweight='bold',
                color=C['white'], ha='center', va='center')

    for i in range(4):
        y1 = layers[i][0] + 1.15; y2 = layers[i+1][0]
        ax.annotate('', xy=(5, y2), xytext=(5, y1),
                    arrowprops=dict(arrowstyle='->', color=C['border'], lw=1.5))

    for yb, yt, label, color in [
        (0.3, 3.15, 'Human\nDomain', C['secondary']),
        (3.3, 4.65, 'AI\nDomain', C['accent']),
        (4.8, 7.65, 'Code +\nChain', C['danger'])]:
        ax.plot([0.45, 0.45], [yb, yt], color=color, lw=2.5, alpha=0.6, solid_capstyle='round')
        ax.text(0.2, (yb+yt)/2, label, fontsize=8, color=color,
                ha='center', va='center', rotation=90, fontweight='bold')

    fig.savefig(os.path.join(OUT, 'fig1_architecture.png'))
    plt.close(fig)
    print('[ok] fig1')


# ── Fig 2: State Machine ─────────────────────────────────
def fig2():
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.set_xlim(-0.5, 11.5); ax.set_ylim(-0.2, 5.2); ax.axis('off')
    fig.patch.set_facecolor(C['white'])

    def box(name, x, y, bg, ec, w=1.6, h=0.7):
        b = FancyBboxPatch((x-w/2, y-h/2), w, h, boxstyle="round,pad=0.08",
                           facecolor=bg, edgecolor=ec, linewidth=2)
        ax.add_patch(b)
        ax.text(x, y, name, fontsize=11, fontweight='bold', ha='center', va='center', color=ec)

    box('PENDING',    1.0, 2.5, C['bg_light'], C['border'])
    box('PROPOSED',   3.5, 2.5, C['bg1'], C['primary'])
    box('CHALLENGED', 6.0, 2.5, C['bg2'], C['secondary'], w=1.8)
    box('ACCEPTED',   8.5, 4.0, C['bg3'], C['accent'])
    box('REJECTED',   8.5, 1.0, C['bg5'], C['danger'])
    box('AUTO',      10.5, 4.5, '#D1FAE5', '#047857', w=1.3)
    box('HOLD',      10.5, 2.5, '#FEF3C7', '#B45309', w=1.3)
    box('MANUAL',    10.5, 0.5, '#FEE2E2', '#B91C1C', w=1.3)

    def arrow(sx,sy,ex,ey,label,color=C['text_mid'],lbl_off=(0,0.22)):
        ax.annotate('', xy=(ex,ey), xytext=(sx,sy),
                    arrowprops=dict(arrowstyle='->', color=color, lw=1.5))
        mx, my = (sx+ex)/2+lbl_off[0], (sy+ey)/2+lbl_off[1]
        ax.text(mx, my, label, fontsize=9, color=color, ha='center', style='italic')

    arrow(1.8,2.5, 2.7,2.5, 'propose')
    arrow(4.3,2.5, 5.1,2.5, 'challenge')
    arrow(6.9,2.85, 7.7,3.75, 'accept', C['accent'], (0,0.15))
    arrow(6.9,2.15, 7.7,1.25, 'reject', C['danger'], (0,-0.15))

    gate = FancyBboxPatch((9.4, 0.0), 0.5, 5.0, boxstyle="round,pad=0.05",
                           facecolor='#FFF7ED', edgecolor=C['warning'],
                           linewidth=1.5, linestyle='--', alpha=0.5)
    ax.add_patch(gate)
    ax.text(9.65, 5.1, 'Policy Gates', fontsize=9, color=C['warning'],
            ha='center', fontweight='bold')

    for sx,sy,ex,ey in [(9.3,4.0,9.85,4.5),(9.3,4.0,9.85,2.5),
                         (9.3,1.0,9.85,2.5),(9.3,1.0,9.85,0.5)]:
        ax.annotate('', xy=(ex,ey), xytext=(sx,sy),
                    arrowprops=dict(arrowstyle='->', color=C['border'], lw=1.2, linestyle='--'))

    fig.savefig(os.path.join(OUT, 'fig2_state_machine.png'))
    plt.close(fig)
    print('[ok] fig2')


# ── Fig 3: Source Curation Protocol ───────────────────────
def fig3():
    fig, ax = plt.subplots(figsize=(11, 5.5))
    ax.set_xlim(0, 11.5); ax.set_ylim(0, 5.8); ax.axis('off')
    fig.patch.set_facecolor(C['white'])

    phases = [
        (0.2, 'Phase 1\nSubmission', '24h window\n\n- Submit evidence\n  with bond\n- Whitelisted\n  auto-included', C['primary']),
        (2.4, 'Phase 2\nVoting', '48h window\n\n- Token-weighted\n  Valid / Invalid\n- Whitelist\n  protected', C['secondary']),
        (4.6, 'Phase 3\nAI Analysis', 'Proposer\n- Quality-weighted\n  analysis\nChallenger\n- Adversarial test', C['accent']),
        (6.8, 'Phase 4\nPolicy Engine', 'Deterministic\n\n- 8 hard rules\n- Deviation\n- Diversity\n- Freshness', C['warning']),
        (9.0, 'Phase 5\nResolution', '', C['danger']),
    ]

    for x, title, desc, color in phases:
        FancyBboxPatch_o = FancyBboxPatch((x, 0.4), 2.0, 4.6, boxstyle="round,pad=0.1",
                             facecolor=C['white'], edgecolor=color, linewidth=1.5)
        ax.add_patch(FancyBboxPatch_o)
        hdr = FancyBboxPatch((x, 4.1), 2.0, 0.9, boxstyle="round,pad=0.1",
                              facecolor=color, edgecolor=color, linewidth=1.5)
        ax.add_patch(hdr)
        ax.text(x+1.0, 4.55, title, fontsize=9.5, fontweight='bold',
                color=C['white'], ha='center', va='center')
        if desc:
            ax.text(x+1.0, 2.3, desc, fontsize=8.5, color=C['text_mid'],
                    ha='center', va='center')

    ax.text(9.5, 3.2, 'AUTO', fontsize=13, fontweight='bold', color='#047857', ha='left')
    ax.text(9.5, 2.7, 'Resolve\nimmediately', fontsize=9, color=C['text_mid'], ha='left')
    ax.plot([9.2, 10.8], [2.2, 2.2], color=C['border'], lw=0.8, linestyle='--')
    ax.text(9.5, 1.7, 'HOLD', fontsize=13, fontweight='bold', color='#B45309', ha='left')
    ax.text(9.5, 1.2, 'Escalate to\nhuman review', fontsize=9, color=C['text_mid'], ha='left')

    for i in range(4):
        xs = phases[i][0]+2.0; xe = phases[i+1][0]
        ax.annotate('', xy=(xe+0.05, 2.5), xytext=(xs-0.05, 2.5),
                    arrowprops=dict(arrowstyle='->', color=C['text_mid'], lw=1.5))

    fig.savefig(os.path.join(OUT, 'fig3_source_curation.png'))
    plt.close(fig)
    print('[ok] fig3')


# ── Fig 4: Attack Cost ───────────────────────────────────
def fig4():
    fig = plt.figure(figsize=(11, 5))
    fig.patch.set_facecolor(C['white'])

    ax1 = fig.add_subplot(121)
    systems = ['UMA\nDirect Vote', 'Kleros\nJury', 'Augur\nDispute', 'PoRE\nSrc. Curation']
    costs = [10.5, 25, 18, 95]
    colors = [C['danger'], C['warning'], C['warning'], C['accent']]

    bars = ax1.barh(systems, costs, color=colors, edgecolor='white', height=0.55)
    for bar, cost, sys in zip(bars, costs, systems):
        if 'PoRE' in sys:
            ax1.text(bar.get_width()-5, bar.get_y()+bar.get_height()/2,
                    'inf*', fontsize=14, fontweight='bold', color=C['white'],
                    va='center', ha='right', family='monospace')
        else:
            ax1.text(bar.get_width()+1.5, bar.get_y()+bar.get_height()/2,
                    f'${cost}M', fontsize=11, fontweight='bold', color=C['text'], va='center')

    ax1.set_xlim(0, 115)
    ax1.set_xlabel('Est. Attack Cost (USD millions)', fontsize=10, color=C['text'])
    ax1.set_title('(a) Attack Cost by System', fontsize=12, fontweight='bold', color=C['text'])
    ax1.spines['top'].set_visible(False)
    ax1.spines['right'].set_visible(False)
    ax1.tick_params(colors=C['text_mid'], labelsize=10)

    N = 5
    theta = np.linspace(0, 2*np.pi, N, endpoint=False)
    theta_c = np.concatenate([theta, [theta[0]]])
    ax2 = fig.add_subplot(122, polar=True)
    ax2.set_facecolor(C['white'])

    cats = ['Source\nCount', 'Type\nDiversity', 'Quality\nWeight', 'Freshness', 'Policy\nRules']
    uma = [0.2,0.1,0.1,0.1,0.1,0.2]
    pore = [0.9,0.85,0.9,0.8,0.95,0.9]

    ax2.plot(theta_c, pore, 's-', color=C['primary'], lw=2.5, label='PoRE', markersize=7, zorder=3)
    ax2.fill(theta_c, pore, color=C['primary'], alpha=0.15)
    ax2.plot(theta_c, uma, 'o-', color=C['danger'], lw=2, label='UMA', markersize=6, zorder=2)
    ax2.fill(theta_c, uma, color=C['danger'], alpha=0.15)

    ax2.set_xticks(theta)
    ax2.set_xticklabels(cats, fontsize=9, color=C['text_mid'])
    ax2.set_ylim(0, 1)
    ax2.set_yticks([0.25, 0.5, 0.75])
    ax2.set_yticklabels(['', '', ''], fontsize=7)
    ax2.legend(loc='upper right', fontsize=10, framealpha=0.9, bbox_to_anchor=(1.35, 1.15))
    ax2.set_title('(b) Constraint Dimensionality', fontsize=12,
                  fontweight='bold', color=C['text'], pad=25)
    ax2.grid(color=C['border'], alpha=0.4)

    fig.tight_layout(w_pad=3)
    fig.savefig(os.path.join(OUT, 'fig4_attack_cost.png'))
    plt.close(fig)
    print('[ok] fig4')


# ── Fig 5: Case Study ────────────────────────────────────
def fig5():
    fig, ax = plt.subplots(figsize=(11, 6.5))
    ax.set_xlim(0, 11); ax.set_ylim(0, 7.2); ax.axis('off')
    fig.patch.set_facecolor(C['white'])

    sources = [
        ('US State Dept', 'official_govt', 0.95, 0.10),
        ('Ukraine MFA', 'official_govt', 0.95, 0.15),
        ('Reuters', 'news_agency', 0.90, 0.20),
        ('AP', 'news_agency', 0.85, 0.20),
        ('Polymarket', 'social_media', 0.20, 0.79),
    ]

    y_s = 6.0
    for i, (name, stype, q, v) in enumerate(sources):
        y = y_s - i*1.05
        whale = 'Polymarket' in name
        bg = '#FEE2E2' if whale else C['bg1']
        ec = C['danger'] if whale else C['primary']
        b = FancyBboxPatch((0.2, y-0.3), 3.1, 0.6, boxstyle="round,pad=0.05",
                           facecolor=bg, edgecolor=ec, linewidth=1.2)
        ax.add_patch(b)
        ax.text(0.4, y+0.05, name, fontsize=10, fontweight='bold', color=C['text'], va='center')
        ax.text(0.4, y-0.17, f'q={q:.2f}  v={v:.2f}  [{stype}]',
                fontsize=8, color=C['text_mid'], va='center')
        ax.annotate('', xy=(3.8, y), xytext=(3.3, y),
                    arrowprops=dict(arrowstyle='->', color=C['text_mid'], lw=1.5))

    eng = FancyBboxPatch((3.8, 0.8), 2.8, 5.8, boxstyle="round,pad=0.1",
                          facecolor=C['bg_light'], edgecolor=C['border'], linewidth=1.5)
    ax.add_patch(eng)
    ax.text(5.2, 6.3, 'PoRE Engine', fontsize=13, fontweight='bold', ha='center', color=C['text'])

    ax.text(5.2, 5.7, 'Quality-Weighted Average', fontsize=10,
            fontweight='bold', ha='center', color=C['primary'])
    for j, line in enumerate(['(0.10*0.95 + 0.15*0.95 + 0.20*0.90',
                               ' + 0.20*0.85 + 0.79*0.20) / 3.85',
                               ' = 0.194  =>  NO']):
        fw = 'bold' if j==2 else 'normal'
        ax.text(5.2, 5.3-j*0.3, line, fontsize=8.5, ha='center',
                color=C['text'], fontweight=fw, family='monospace')

    ax.text(5.2, 4.1, 'Policy Violations', fontsize=10,
            fontweight='bold', ha='center', color=C['danger'])
    for j, v in enumerate([
        'DEVIATION_TOO_HIGH  (0.43 > 0.30)',
        'CONFIDENCE_TOO_LOW  (0.35 < 0.60)',
        'SOURCE_CONFLICT     (official vs market)',
        'EVIDENCE_TOO_OLD    (>6h)',
        'TOO_EARLY           (before deadline)']):
        ax.text(5.2, 3.65-j*0.3, v, fontsize=8, ha='center',
                color=C['danger'], family='monospace')

    vb = FancyBboxPatch((4.1, 1.0), 2.2, 0.6, boxstyle="round,pad=0.08",
                         facecolor='#FEF3C7', edgecolor='#B45309', linewidth=2.5)
    ax.add_patch(vb)
    ax.text(5.2, 1.3, 'HOLD', fontsize=15, fontweight='bold',
            ha='center', va='center', color='#B45309')
    ax.annotate('', xy=(5.2, 1.6), xytext=(5.2, 1.9),
                arrowprops=dict(arrowstyle='->', color='#B45309', lw=2))

    comp = FancyBboxPatch((7.2, 0.8), 3.4, 5.8, boxstyle="round,pad=0.1",
                           facecolor=C['white'], edgecolor=C['border'], linewidth=1)
    ax.add_patch(comp)
    ax.text(8.9, 6.3, 'Comparison', fontsize=13, fontweight='bold', ha='center', color=C['text'])

    uma = FancyBboxPatch((7.5, 4.5), 2.8, 1.4, boxstyle="round,pad=0.08",
                          facecolor='#FEE2E2', edgecolor=C['danger'], linewidth=1.5)
    ax.add_patch(uma)
    ax.text(8.9, 5.55, 'UMA (Actual)', fontsize=11, fontweight='bold', ha='center', color=C['danger'])
    ax.text(8.9, 5.15, 'Whale (25% votes) = YES', fontsize=9.5, ha='center', color=C['text'])
    ax.text(8.9, 4.8, '$7M loss to NO holders', fontsize=9.5, ha='center', color=C['danger'], fontweight='bold')

    pore = FancyBboxPatch((7.5, 2.6), 2.8, 1.4, boxstyle="round,pad=0.08",
                           facecolor='#D1FAE5', edgecolor=C['accent'], linewidth=1.5)
    ax.add_patch(pore)
    ax.text(8.9, 3.65, 'PoRE (Simulated)', fontsize=11, fontweight='bold', ha='center', color=C['accent'])
    ax.text(8.9, 3.25, '5 violations = HOLD', fontsize=9.5, ha='center', color=C['text'])
    ax.text(8.9, 2.9, 'Escalated to human review', fontsize=9.5, ha='center', color=C['accent'], fontweight='bold')

    lg = FancyBboxPatch((7.5, 1.0), 2.8, 1.0, boxstyle="round,pad=0.06",
                         facecolor=C['bg_light'], edgecolor=C['border'], linewidth=0.8)
    ax.add_patch(lg)
    ax.text(8.9, 1.75, 'Quality Weighting', fontsize=9.5, fontweight='bold', ha='center', color=C['text'])
    ax.text(8.9, 1.4, 'Official (q=0.95) dominates', fontsize=9, ha='center', color=C['text_mid'])
    ax.text(8.9, 1.1, 'Market signal (q=0.20) minimal', fontsize=9, ha='center', color=C['text_mid'])

    fig.savefig(os.path.join(OUT, 'fig5_case_study.png'))
    plt.close(fig)
    print('[ok] fig5')


# ── Fig 6: Trilemma ──────────────────────────────────────
def fig6():
    fig, ax = plt.subplots(figsize=(7, 6))
    ax.set_xlim(-0.5, 10.5); ax.set_ylim(-0.5, 9.5); ax.axis('off')
    fig.patch.set_facecolor(C['white'])

    top=(5,8.5); left=(0.5,1.5); right=(9.5,1.5)
    tri = plt.Polygon([top,left,right], fill=False, edgecolor=C['border'], linewidth=2)
    ax.add_patch(tri)

    for (x,y), lbl, c in [(top,'Decentralization',C['primary']),
                            (left,'Accuracy',C['accent']),
                            (right,'Speed',C['warning'])]:
        ax.text(x, y+0.5, lbl, fontsize=14, fontweight='bold', ha='center', color=c)

    ax.text(2.0, 5.5, 'UMA', fontsize=11, fontweight='bold', ha='center', color=C['danger'],
            bbox=dict(boxstyle='round,pad=0.3', facecolor='#FEE2E2', edgecolor=C['danger']))
    ax.text(2.0, 4.8, 'sacrifices accuracy', fontsize=9, ha='center', color=C['danger'], style='italic')

    ax.text(8.0, 5.5, 'Centralized\nOracle', fontsize=11, fontweight='bold', ha='center',
            color=C['text_mid'],
            bbox=dict(boxstyle='round,pad=0.3', facecolor=C['bg_light'], edgecolor=C['border']))
    ax.text(8.0, 4.7, 'sacrifices\ndecentralization', fontsize=9, ha='center', color=C['text_mid'], style='italic')

    ax.text(5, 0.5, 'Kleros / Augur', fontsize=11, fontweight='bold', ha='center',
            color=C['text_mid'],
            bbox=dict(boxstyle='round,pad=0.3', facecolor=C['bg_light'], edgecolor=C['border']))
    ax.text(5, -0.2, 'sacrifices speed', fontsize=9, ha='center', color=C['text_mid'], style='italic')

    pore = FancyBboxPatch((3.0, 2.8), 4.0, 2.2, boxstyle="round,pad=0.15",
                           facecolor=C['primary'], edgecolor='#1D4ED8', linewidth=2)
    ax.add_patch(pore)
    ax.text(5, 4.4, 'PoRE', fontsize=20, fontweight='bold', ha='center', va='center', color=C['white'])
    ax.text(5, 3.3, 'AUTO: clear cases (speed)\nHOLD: ambiguous (accuracy)\nNo central authority (decentralized)',
            fontsize=10, ha='center', va='center', color='#BFDBFE', linespacing=1.5)

    fig.savefig(os.path.join(OUT, 'fig6_trilemma.png'))
    plt.close(fig)
    print('[ok] fig6')


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    fig1(); fig2(); fig3(); fig4(); fig5(); fig6()
    print(f'\nAll diagrams saved to {OUT}/')
