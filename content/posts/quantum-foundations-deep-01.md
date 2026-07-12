---
title: "【量子力学II・詳解】調和振動子を解析法と代数法の両方から理解する"
date: 2026-07-12
draft: false
categories: ["量子力学"]
---

> **この教材について**  
> 本ページは、運営者が以前に作成し実際に解いた量子力学演習を土台として、問題設定・文章・構成を再設計した独自教材です。大学の試験問題の転載や公式解答ではありません。生成AIは整理と検算の補助に利用していますが、解法の選択、学習上の重点、最終確認は運営者が行っています。誤りを見つけた場合はGitHub Issueでお知らせください。詳しくは[制作方針]({{< relref "/policy" >}})をご覧ください。

## このページで大切にすること

調和振動子は、公式を覚えるだけなら短く終わります。しかし本当に重要なのは、**同じ物理を異なる数学で見ても矛盾しない**ことです。

- 微分方程式からは、波動関数の漸近形、量子化、節、パリティが見える。
- 生成消滅演算子からは、エネルギーの階段構造と選択則が見える。
- 重ね合わせ状態からは、定常状態と時間発展する状態の違いが見える。

以下では、答えだけでなく「なぜその入口を選ぶのか」を明示します。

---

## 問題1：解析法でエネルギー量子化を導く

1次元調和振動子

$$\hat H=-\frac{\hbar^2}{2m}\frac{d^2}{dx^2}+\frac12m\omega^2x^2$$

を考える。

1. 無次元変数 $\xi=\sqrt{m\omega/\hbar}\,x$ を導入し、時間に依存しないSchrödinger方程式を無次元化せよ。
2. $|\xi|\gg1$ で許される波動関数の漸近形を調べよ。
3. $\psi(\xi)=e^{-\xi^2/2}h(\xi)$ と置き、$h$ の満たす方程式を求めよ。
4. 級数解が有限次数で打ち切られなければならない理由を説明し、エネルギーを求めよ。
5. 固有関数のパリティと節の数を説明せよ。

### 出題意図

この問題の核心は、量子化条件を外から与えないことです。$E_n=\hbar\omega(n+1/2)$ を知っているだけでは、なぜ整数 $n$ が現れるかは分かりません。ここでは「無限遠で規格化できる」という物理的要求が、級数の打ち切りという数学的条件へ変わる過程を追います。

### 方針：最初に無次元化する理由

元の方程式には $m,\omega,\hbar$ が混在しています。無次元化すると、装置や粒子に依存する尺度と、方程式そのものの構造を分けられます。自然な長さ

$$\ell=\sqrt{\frac{\hbar}{m\omega}}$$

を使えば $\xi=x/\ell$ です。$\ell$ は「基底状態が広がる典型的な長さ」です。質量が大きいほど、またはポテンシャルが硬いほど波動関数が狭くなることも、この式から読めます。

### 解答1-1：無次元方程式

$d/dx=(1/\ell)d/d\xi$ を使うと、

$$-\frac{\hbar^2}{2m\ell^2}\frac{d^2\psi}{d\xi^2}+\frac12m\omega^2\ell^2\xi^2\psi=E\psi$$

です。$m\omega\ell^2=\hbar$ なので、両項の係数はいずれも $\hbar\omega/2$ になります。両辺を $\hbar\omega/2$ で割り、

$$\epsilon=\frac{2E}{\hbar\omega}$$

と置けば、

$$\boxed{\frac{d^2\psi}{d\xi^2}+(\epsilon-\xi^2)\psi=0}$$

を得ます。

> **検算**：$\xi$ と $\epsilon$ は無次元です。微分項、$\epsilon\psi$、$\xi^2\psi$ の三項は同じ次元を持ちます。

### 解答1-2：無限遠での振る舞い

$|\xi|\gg1$ では有限な $\epsilon$ より $\xi^2$ が支配的なので、

$$\psi''-\xi^2\psi\simeq0$$

です。指数関数型 $\psi\sim e^{a\xi^2}$ を試すと、最高次では $4a^2\xi^2-\xi^2=0$ だから $a=\pm1/2$ です。したがって候補は

$$\psi\sim e^{-\xi^2/2},\qquad e^{+\xi^2/2}$$

です。後者は無限遠で発散し、$\int|\psi|^2d\xi$ が有限になりません。物理的状態として許されるのは

$$\boxed{\psi\sim e^{-\xi^2/2}}$$

だけです。

ここで重要なのは「発散する解を見なかったことにする」のではなく、Hilbert空間に属するという状態の定義が解を選別していることです。

### 解答1-3：Hermite方程式

許される漸近形を先に取り出し、

$$\psi(\xi)=e^{-\xi^2/2}h(\xi)$$

と置きます。微分は

$$\psi'=e^{-\xi^2/2}(h'-\xi h)$$

$$\psi''=e^{-\xi^2/2}\left[h''-2\xi h'+(\xi^2-1)h\right]$$

です。無次元方程式へ代入すると $\xi^2h$ が打ち消され、

$$\boxed{h''-2\xi h'+(\epsilon-1)h=0}$$

を得ます。

$h(\xi)=\sum_{j=0}^{\infty}a_j\xi^j$ として係数を比べると、

$$\boxed{a_{j+2}=\frac{2j+1-\epsilon}{(j+2)(j+1)}a_j}$$

です。偶数係数と奇数係数は混ざらないため、解は偶関数系列と奇関数系列に分かれます。これはポテンシャル $V(x)=V(-x)$ の空間反転対称性の反映です。

### 解答1-4：打ち切りと量子化

級数が永遠に続く一般解は、大きな $j$ で $a_{j+2}\simeq2a_j/j$ となります。この係数列が作る $h$ はおおよそ $e^{\xi^2}$ のように成長し、外に出しておいた $e^{-\xi^2/2}$ を上回ります。結局 $\psi$ は $e^{+\xi^2/2}$ 型に戻り、規格化不能です。

したがって、ある非負整数 $n$ で分子が0になり、同じ偶奇系列が止まる必要があります。

$$2n+1-\epsilon=0$$

よって、

$$\epsilon=2n+1$$

$$\boxed{E_n=\hbar\omega\left(n+\frac12\right)\qquad(n=0,1,2,\ldots)}$$

です。打ち切られた多項式がHermite多項式 $H_n(\xi)$ で、規格化された固有関数は

$$\boxed{\psi_n(x)=\frac{1}{\sqrt{2^nn!\sqrt\pi\,\ell}}H_n(x/\ell)e^{-x^2/(2\ell^2)}}$$

となります。

### 解答1-5：パリティと節

漸化式が偶数系列と奇数系列を混ぜないため、

$$\psi_n(-x)=(-1)^n\psi_n(x)$$

です。$n$ が偶数なら偶関数、奇数なら奇関数です。また $H_n$ は実軸上に $n$ 個の単純零点を持つため、第 $n$ 固有状態には $n$ 個の節があります。

節が増えると波動関数は短い距離で符号を変え、曲率が大きくなります。運動エネルギー演算子が $-d^2/dx^2$ に比例することを考えると、高い励起状態ほど運動エネルギーが大きいという直感につながります。

### 典型的な誤答と、その原因

- **最初から多項式だけを仮定する**：Gaussian因子を取り出す前に多項式を仮定すると、無限遠の支配項を満たせません。
- **発散解を単に捨てる**：理由は「見た目が悪い」からではなく、Bornの確率解釈に必要な平方可積分性を満たさないからです。
- **$n$ を連続量として扱う**：$n$ は級数が止まる次数なので、非負整数以外を取りません。

---

## 問題2：代数法で同じスペクトルを再構成する

生成・消滅演算子を

$$\hat a=\sqrt{\frac{m\omega}{2\hbar}}\hat x+\frac{i}{\sqrt{2m\hbar\omega}}\hat p,\qquad \hat a^\dagger=\sqrt{\frac{m\omega}{2\hbar}}\hat x-\frac{i}{\sqrt{2m\hbar\omega}}\hat p$$

と定義する。

1. $[\hat a,\hat a^\dagger]=1$ と $\hat H=\hbar\omega(\hat a^\dagger\hat a+1/2)$ を示せ。
2. 数演算子 $\hat N=\hat a^\dagger\hat a$ の固有値が非負整数になることを示せ。
3. $\hat a|0\rangle=0$ から基底状態の波動関数を求めよ。
4. $\langle x\rangle_n,\langle x^2\rangle_n,\langle p^2\rangle_n$ と不確定性積を求めよ。

### 出題意図と方針

解析法は波動関数の形を詳しく教えますが、計算量が多い方法です。代数法は交換関係だけからスペクトルを組み立てます。二つの方法は競争相手ではなく、知りたい量に応じて使い分ける道具です。

### 解答2-1：Hamiltonianの因数分解

$[\hat x,\hat p]=i\hbar$ を使って積を取ると、交差項が交換子として残り、

$$\hat a^\dagger\hat a=\frac{m\omega}{2\hbar}\hat x^2+\frac{1}{2m\hbar\omega}\hat p^2-\frac12$$

です。したがって、

$$\boxed{\hat H=\hbar\omega\left(\hat N+\frac12\right)}$$

となります。また定義を直接代入すれば

$$\boxed{[\hat a,\hat a^\dagger]=1}$$

です。$1/2$ は単なる調整項ではありません。$x$ と $p$ が可換なら現れず、零点エネルギーは量子論の非可換性から生じています。

### 解答2-2：階段構造

交換関係から

$$[\hat N,\hat a^\dagger]=\hat a^\dagger,\qquad [\hat N,\hat a]=-\hat a$$

です。$\hat N|\nu\rangle=\nu|\nu\rangle$ なら、$\hat a^\dagger|\nu\rangle$ は固有値 $\nu+1$、$\hat a|\nu\rangle$ は $\nu-1$ の固有状態になります。

さらに、

$$\|\hat a|\nu\rangle\|^2=\langle\nu|\hat a^\dagger\hat a|\nu\rangle=\nu$$

なので $\nu\ge0$ です。もし下降を無限に続けられるなら、いつか負のノルム二乗が現れます。それは不可能なので、最低状態 $|0\rangle$ があり、

$$\hat a|0\rangle=0$$

で止まります。上昇を繰り返して

$$|n\rangle=\frac{(\hat a^\dagger)^n}{\sqrt{n!}}|0\rangle$$

を得るため、固有値は $n=0,1,2,\ldots$ です。解析法の「級数の打ち切り」と、代数法の「負ノルムを避ける最低状態」は、同じ量子化を別の角度から述べています。

### 解答2-3：基底状態の波動関数

位置表示で $\hat p=-i\hbar d/dx$ とすると、$\hat a\psi_0=0$ は

$$\left(\sqrt{\frac{m\omega}{2\hbar}}x+\sqrt{\frac{\hbar}{2m\omega}}\frac{d}{dx}\right)\psi_0=0$$

です。整理して、

$$\frac{d\psi_0}{dx}=-\frac{m\omega}{\hbar}x\psi_0$$

$$\frac{d\psi_0}{\psi_0}=-\frac{m\omega}{\hbar}x\,dx$$

と積分すれば、

$$\psi_0(x)=A\exp\left(-\frac{m\omega x^2}{2\hbar}\right)$$

です。規格化 $\int|\psi_0|^2dx=1$ から

$$\boxed{\psi_0(x)=\left(\frac{m\omega}{\pi\hbar}\right)^{1/4}\exp\left(-\frac{m\omega x^2}{2\hbar}\right)}$$

を得ます。解析法で無限遠の振る舞いとして先に見つけたGaussianが、代数法では最低状態条件そのものから出てきました。

### 解答2-4：期待値と不確定性

逆変換は

$$\hat x=\sqrt{\frac{\hbar}{2m\omega}}(\hat a+\hat a^\dagger),\qquad \hat p=-i\sqrt{\frac{m\hbar\omega}{2}}(\hat a-\hat a^\dagger)$$

です。$\langle n|n\pm1\rangle=0$ なので、

$$\boxed{\langle x\rangle_n=\langle p\rangle_n=0}$$

です。二乗すると、状態を変えない $\hat a\hat a^\dagger$ と $\hat a^\dagger\hat a$ だけが期待値へ寄与します。

$$\langle x^2\rangle_n=\frac{\hbar}{2m\omega}\langle n|\hat a^2+\hat a\hat a^\dagger+\hat a^\dagger\hat a+(\hat a^\dagger)^2|n\rangle$$

$$=\frac{\hbar}{2m\omega}\left[(n+1)+n\right]$$

したがって、

$$\boxed{\langle x^2\rangle_n=\frac{\hbar}{m\omega}\left(n+\frac12\right)}$$

同様に、

$$\boxed{\langle p^2\rangle_n=m\hbar\omega\left(n+\frac12\right)}$$

です。平均値が0なので、

$$\boxed{\Delta x\Delta p=\hbar\left(n+\frac12\right)}$$

となります。基底状態だけが最小不確定状態 $\Delta x\Delta p=\hbar/2$ です。

> **物理像**：$n$ が増えると位置の広がりと運動量の広がりが同時に増えます。これは「粒子がぼやける」というより、より大きな位相空間領域を占める励起状態になったと読む方が適切です。

---

## 問題3：重ね合わせ状態はどのように動くか

$t=0$ で

$$|\psi(0)\rangle=\frac{1}{\sqrt2}\left(|0\rangle+|1\rangle\right)$$

にある調和振動子を考える。

1. $|\psi(t)\rangle$ を求めよ。
2. $\langle x\rangle_t$ と $\langle p\rangle_t$ を求めよ。
3. Ehrenfestの定理と整合することを確かめよ。
4. エネルギー測定の確率と $\Delta E$ を求めよ。

### 解答3-1：各固有状態は別々の位相を得る

エネルギー固有状態の時間発展は

$$|n,t\rangle=e^{-iE_nt/\hbar}|n\rangle$$

なので、

$$\boxed{|\psi(t)\rangle=\frac{1}{\sqrt2}\left(e^{-i\omega t/2}|0\rangle+e^{-i3\omega t/2}|1\rangle\right)}$$

です。全体位相 $e^{-i\omega t/2}$ は測定確率に影響しませんが、二項の**相対位相** $e^{-i\omega t}$ は干渉項を時間変化させます。

### 解答3-2：位置と運動量の平均

対角要素 $\langle0|x|0\rangle$ と $\langle1|x|1\rangle$ はパリティにより0です。残るのは交差項で、

$$\langle0|\hat x|1\rangle=\sqrt{\frac{\hbar}{2m\omega}}$$

です。よって、

$$\boxed{\langle x\rangle_t=\sqrt{\frac{\hbar}{2m\omega}}\cos\omega t}$$

となります。同様に $\langle0|\hat p|1\rangle=-i\sqrt{m\hbar\omega/2}$ を使えば、

$$\boxed{\langle p\rangle_t=-\sqrt{\frac{m\hbar\omega}{2}}\sin\omega t}$$

です。

個々の定常状態では $\langle x\rangle=0$ ですが、異なるパリティの状態を重ねると、交差項が空間の左右対称性を一時的に崩し、波束の中心が動きます。

### 解答3-3：Ehrenfestの定理による検算

まず、

$$m\frac{d\langle x\rangle}{dt}=-m\omega\sqrt{\frac{\hbar}{2m\omega}}\sin\omega t=-\sqrt{\frac{m\hbar\omega}{2}}\sin\omega t=\langle p\rangle$$

です。さらに、

$$\frac{d\langle p\rangle}{dt}=-\omega\sqrt{\frac{m\hbar\omega}{2}}\cos\omega t=-m\omega^2\langle x\rangle$$

となります。したがって、

$$m\frac{d^2\langle x\rangle}{dt^2}=-m\omega^2\langle x\rangle$$

で、平均値は古典的調和振動の式を満たします。ただし、波動関数そのものが古典粒子へ変わったわけではありません。平均の周囲には有限の量子ゆらぎがあります。

### 解答3-4：エネルギー測定

時間発展で係数の絶対値は変わらないため、いつ測定しても

$$P(E_0)=P(E_1)=\frac12$$

です。平均は

$$\langle E\rangle=\frac{E_0+E_1}{2}=\hbar\omega$$

で、

$$\langle E^2\rangle=\frac{E_0^2+E_1^2}{2}=\frac54(\hbar\omega)^2$$

です。したがって、

$$\boxed{\Delta E=\sqrt{\langle E^2\rangle-\langle E\rangle^2}=\frac{\hbar\omega}{2}}$$

$\langle E\rangle$ は保存されますが、状態はエネルギー固有状態ではないため、測定値には幅があります。「期待値が一定」と「物理量が確定している」は別の主張です。

---

## 二つの解法をどう使い分けるか

| 知りたいもの | 解析法 | 代数法 |
|---|---|---|
| エネルギー準位 | 導けるが計算は長い | 最短で構造が見える |
| 波動関数の形・節 | 直接見える | 位置表示へ戻す必要がある |
| 行列要素・選択則 | 積分が必要 | 昇降演算子で速い |
| 境界条件の意味 | 非常に見えやすい | 抽象化される |
| 一般化 | 特殊関数へつながる | 多体系・場の量子論へつながる |

一方だけを「正しい方法」と考えず、同じ答えを二方向から確認することが理解を深くします。

## 学習チェック

- 規格化可能性が級数の打ち切りを要求する流れを説明できるか。
- 零点エネルギーと交換関係のつながりを説明できるか。
- $\langle x\rangle=0$ と「粒子が原点にある」の違いを説明できるか。
- 定常状態の重ね合わせで時間依存する観測量が生じる理由を、相対位相から説明できるか。

## 次の一歩

このページの代数を使うと、非調和摂動 $\gamma x^4$ の行列要素や、電気双極子遷移の選択則を効率よく計算できます。発展編は[摂動論・変分法・有限時間遷移]({{< relref "/posts/quantum-mechanics-original-02" >}})へ続きます。
