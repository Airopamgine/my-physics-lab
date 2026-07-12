---
title: "【量子力学II】独自演習：摂動論・変分法・有限時間遷移"
date: 2026-07-12
draft: false
categories: ["量子力学"]
---

> **この教材について**  
> 本ページは、学部量子力学の標準的な到達目標をもとに独自に作成した演習教材です。大学・担当教員が作成した試験問題の転載ではなく、公式の問題・解答でもありません。問題作成と文章整理には生成AIを補助的に利用し、公開前に内容と計算を確認しています。誤りを見つけた場合はGitHub Issueでお知らせください。詳しくは[制作方針]({{< relref "/policy" >}})をご覧ください。

## この演習の狙い

1. 演算子を生成消滅演算子で扱う。
2. 変分法を「上限を与える定理」として理解する。
3. 有限時間の遷移が持つエネルギー幅を導く。

### 解答を読む前に

このページでは、結果の式よりも「近似を選ぶ条件」を重視します。摂動論は摂動が小さいとき、変分法は基底状態の上限を知りたいとき、時間依存摂動論は短時間・弱い遷移を扱うときに使います。同じ“近似”でも、保証されるものと破綻の仕方は異なります。

---

## 問題1：弱い四次非調和性

1次元調和振動子に弱い四次ポテンシャルを加えた系

$$\hat H=\frac{\hat p^2}{2m}+\frac12m\omega^2\hat x^2+\gamma\hat x^4\qquad(\gamma>0)$$

を考える。$\gamma\hat x^4$ を摂動として扱う。

1. 第 $n$ 準位の1次エネルギー補正 $E_n^{(1)}$ を求めよ。
2. 基底状態と第1励起状態のエネルギーを1次まで求めよ。
3. 遷移 $0\to1$ の角振動数が調和振動子の値からどれだけ変化するか求めよ。
4. $\gamma>0$ で高い準位ほど補正が大きくなる理由を説明せよ。

### 解答1-1：位置演算子を生成消滅演算子で表す

$$\hat x=x_0(\hat a+\hat a^\dagger),\qquad x_0=\sqrt{\frac{\hbar}{2m\omega}}$$

です。1次補正は

$$E_n^{(1)}=\gamma\langle n|\hat x^4|n\rangle$$

で与えられます。$(\hat a+\hat a^\dagger)^4$ を展開するとき、期待値に寄与するのは最終的に粒子数を変えない項だけです。交換関係 $[\hat a,\hat a^\dagger]=1$ を用いて整理すると、

$$\langle n|(\hat a+\hat a^\dagger)^4|n\rangle=3(2n^2+2n+1)$$

したがって、

$$\boxed{E_n^{(1)}=3\gamma(2n^2+2n+1)\left(\frac{\hbar}{2m\omega}\right)^2}$$

> **計算の見通し**：すべてを力任せに展開する代わりに、$\hat a|n\rangle=\sqrt n|n-1\rangle$、$\hat a^\dagger|n\rangle=\sqrt{n+1}|n+1\rangle$ を順に作用させても同じ結果を得られます。

### 解答1-2：下位2準位

無摂動エネルギーは $E_n^{(0)}=\hbar\omega(n+1/2)$ です。よって、

$$\boxed{E_0=\frac12\hbar\omega+3\gamma\left(\frac{\hbar}{2m\omega}\right)^2+O(\gamma^2)}$$

$$\boxed{E_1=\frac32\hbar\omega+15\gamma\left(\frac{\hbar}{2m\omega}\right)^2+O(\gamma^2)}$$

### 解答1-3：遷移角振動数

$$\omega_{10}=\frac{E_1-E_0}{\hbar}$$

なので、調和振動子からの変化量は

$$\delta\omega_{10}=\frac{12\gamma}{\hbar}\left(\frac{\hbar}{2m\omega}\right)^2$$

すなわち、

$$\boxed{\delta\omega_{10}=\frac{3\gamma\hbar}{m^2\omega^2}}$$

$\gamma>0$ なら準位間隔は広がります。完全な調和振動子ではすべての隣接準位間隔が同じですが、非調和性があると等間隔性が失われます。

### 解答1-4：物理的意味

高い励起状態ほど波動関数が広がり、古典的転回点も外側へ移動します。そのため $x^4$ の期待値が急速に増え、外側で強く立ち上がる追加ポテンシャルの影響を大きく受けます。

> **よくある誤り**：$E_n^{(1)}$ を「1次の状態補正」と混同すること。エネルギーの1次補正は対角行列要素だけで求まります。

---

## 問題2：純粋四次ポテンシャルへの変分法

$$\hat H=\frac{\hat p^2}{2m}+\kappa x^4\qquad(\kappa>0)$$

の基底状態を、規格化された試行関数

$$\psi_\alpha(x)=\left(\frac{2\alpha}{\pi}\right)^{1/4}e^{-\alpha x^2}\qquad(\alpha>0)$$

で近似する。

1. $\langle x^2\rangle$ と $\langle x^4\rangle$ を求めよ。
2. エネルギー期待値 $E(\alpha)$ を求めよ。
3. 最適な $\alpha_0$ と変分エネルギー $E_{\mathrm var}$ を求めよ。
4. 次元解析と比較し、エネルギーのスケーリングを説明せよ。

### 解答2-1：ガウス積分

確率密度は $|\psi_\alpha|^2\propto e^{-2\alpha x^2}$ です。分散を用いると、

$$\boxed{\langle x^2\rangle=\frac{1}{4\alpha},\qquad \langle x^4\rangle=3\langle x^2\rangle^2=\frac{3}{16\alpha^2}}$$

### 解答2-2：運動エネルギー

2階微分は

$$\frac{d^2\psi_\alpha}{dx^2}=(-2\alpha+4\alpha^2x^2)\psi_\alpha$$

です。したがって、

$$\left\langle\frac{\hat p^2}{2m}\right\rangle=-\frac{\hbar^2}{2m}\int\psi_\alpha^*\frac{d^2\psi_\alpha}{dx^2}dx=\frac{\hbar^2\alpha}{2m}$$

ポテンシャルエネルギーと合わせると、

$$\boxed{E(\alpha)=\frac{\hbar^2\alpha}{2m}+\frac{3\kappa}{16\alpha^2}}$$

第1項は波動関数を狭くするほど増え、第2項は広くするほど増えます。基底状態の幅は両者の妥協で決まります。

### 解答2-3：最小化

$$\frac{dE}{d\alpha}=\frac{\hbar^2}{2m}-\frac{3\kappa}{8\alpha^3}=0$$

より、

$$\boxed{\alpha_0=\left(\frac{3m\kappa}{4\hbar^2}\right)^{1/3}}$$

停留条件から、最適点ではポテンシャル項が運動項の半分になることが分かります。したがって、

$$\boxed{E_{\mathrm var}=\frac{3\hbar^2\alpha_0}{4m}=\frac{3\hbar^2}{4m}\left(\frac{3m\kappa}{4\hbar^2}\right)^{1/3}}$$

変分原理により、これは真の基底状態エネルギーの上限です。

### 解答2-4：スケーリング

定数因子を除けば、

$$\boxed{E_0\propto\hbar^{4/3}\kappa^{1/3}m^{-2/3}}$$

となります。変分法は正確な係数を近似するだけでなく、物理量がパラメータにどう依存するかも正しく捉えます。

> **院試接続**：試行関数を選ぶ際は、規格化できること、基底状態と同じ対称性を持つこと、ハミルトニアンの期待値が有限であることを確認します。

---

## 問題3：有限時間だけ加わる周期摂動

2準位 $|i\rangle,|f\rangle$ のエネルギーを $E_i,E_f$ とし、$\omega_{fi}=(E_f-E_i)/\hbar>0$ とする。$0<t<T$ の間だけ

$$\hat H^{\prime}(t)=\hat V\cos\Omega t$$

が加わる。$V_{fi}=\langle f|\hat V|i\rangle$ とする。

1. 1次摂動論で遷移振幅を積分表示せよ。
2. $\Omega\approx\omega_{fi}$ のとき、回転波近似を用いて遷移確率を求めよ。
3. 最初のゼロ点から、有限時間観測のエネルギー分解能を見積もれ。

### 解答3-1：遷移振幅

相互作用表示で、

$$c_f^{(1)}(T)=-\frac{i}{\hbar}\int_0^T V_{fi}\cos(\Omega t)e^{i\omega_{fi}t}dt$$

です。$\cos\Omega t=(e^{i\Omega t}+e^{-i\Omega t})/2$ を用いると、周波数 $\omega_{fi}+\Omega$ と $\omega_{fi}-\Omega$ の2項に分かれます。

### 解答3-2：共鳴近傍

$\Delta=\omega_{fi}-\Omega$ と置きます。共鳴近傍では $\omega_{fi}+\Omega$ の項は高速振動して平均化されるため、

$$c_f^{(1)}(T)\approx-\frac{iV_{fi}}{2\hbar}\int_0^T e^{i\Delta t}dt$$

です。積分すると、

$$c_f^{(1)}(T)\approx-\frac{iV_{fi}T}{2\hbar}e^{i\Delta T/2}\operatorname{sinc}\left(\frac{\Delta T}{2}\right)$$

ここで $\operatorname{sinc}x=\sin x/x$ です。よって、

$$\boxed{P_{i\to f}(T)\approx\frac{|V_{fi}|^2T^2}{4\hbar^2}\operatorname{sinc}^2\left(\frac{(\omega_{fi}-\Omega)T}{2}\right)}$$

共鳴条件は $\Omega=\omega_{fi}$ です。ただし有限時間では、完全一致しなくても幅を持って遷移します。

### 解答3-3：有限時間による幅

$\operatorname{sinc}$ の最初のゼロは $|\Delta|T/2=\pi$ です。したがって、中心から最初のゼロまでの角周波数幅は

$$|\Delta|=\frac{2\pi}{T}$$

であり、エネルギー幅の尺度は

$$\boxed{\Delta E\sim\frac{\hbar}{T}}$$

です。長時間観測ほど共鳴線が細くなり、エネルギーを精密に区別できます。これは時間とエネルギーのフーリエ的関係の具体例です。

> **適用限界**：共鳴点で式が $T^2$ に比例し続けるのは1次摂動論の範囲だけです。遷移確率が1に近づく前に、ラビ振動を含む非摂動的な2準位解析へ切り替える必要があります。

---

## 深掘り解説：計算をブラックボックスにしない

### A. $\langle n|x^4|n\rangle$ を省略せずに求める

よく引用される

$$\langle n|(\hat a+\hat a^\dagger)^4|n\rangle=3(2n^2+2n+1)$$

を、そのまま公式として使わずに確かめます。非可換な演算子では普通の二項展開をすると項の順序を落としやすいため、まず二回作用させます。$X=\hat a+\hat a^\dagger$ とすると、

$$X|n\rangle=\sqrt n|n-1\rangle+\sqrt{n+1}|n+1\rangle$$

です。もう一度作用させれば、

$$X^2|n\rangle=\sqrt{n(n-1)}|n-2\rangle+(2n+1)|n\rangle+\sqrt{(n+1)(n+2)}|n+2\rangle$$

となります。$X$ はHermitian（エルミート）演算子なので、

$$\langle n|X^4|n\rangle=\lVert X^2|n\rangle\rVert^2$$

と書けます。$|n-2\rangle,|n\rangle,|n+2\rangle$ は互いに直交するため、係数の絶対値二乗を足して、

$$n(n-1)+(2n+1)^2+(n+1)(n+2)=6n^2+6n+3$$

を得ます。したがって、

$$\boxed{\langle n|X^4|n\rangle=3(2n^2+2n+1)}$$

です。

この方法には二つの利点があります。第一に、演算子の順序を意識せず安全に計算できます。第二に、$x^4$ が $n\to n,n\pm2,n\pm4$ を結ぶことも途中の状態から見えます。エネルギーの1次補正には対角成分だけが必要ですが、状態の1次補正には非対角成分が必要です。

> **極限チェック**：$n=0$ では $\langle x^4\rangle=3x_0^4$ です。基底状態の位置分布は分散 $x_0^2$ のGaussianなので、Gaussianの四次モーメント $3\langle x^2\rangle^2$ と一致します。

### B. 変分解の係数をvirial定理で検算する

最適点で

$$K(\alpha)=\frac{\hbar^2\alpha}{2m},\qquad V(\alpha)=\frac{3\kappa}{16\alpha^2}$$

と置きます。停留条件 $dE/d\alpha=0$ に $\alpha$ を掛けると、

$$K-2V=0$$

すなわち、

$$\boxed{K=2V,\qquad E=K+V=\frac32K=3V}$$

です。これは $V(x)\propto x^4$ に対する量子virial定理 $2\langle K\rangle=4\langle V\rangle$ と一致します。

この一致は偶然ではありません。試行関数の $\alpha$ を変えることは波動関数を空間的に拡大・縮小することに対応し、スケール変換に対するエネルギーの停留条件がvirial定理を再現します。もし最小化後の $K$ と $V$ がこの比にならなければ、微分か代入の誤りを疑えます。

変分法が保証するのは

$$E_{\mathrm{var}}\ge E_0$$

だけです。波動関数の各点での誤差が小さいことや、励起状態にも同じ上限原理がそのまま使えることまでは保証しません。上限という強い性質と、適用範囲の狭さを同時に覚える必要があります。

### C. 回転波近似の前に、厳密な1次振幅を見る

回転波近似を使う前の積分は、そのまま実行できます。

$$c_f^{(1)}(T)=-\frac{V_{fi}}{2\hbar}\left[\frac{e^{i(\omega_{fi}+\Omega)T}-1}{\omega_{fi}+\Omega}+\frac{e^{i(\omega_{fi}-\Omega)T}-1}{\omega_{fi}-\Omega}\right]$$

二つの分母を比べると、共鳴近傍では

$$|\omega_{fi}-\Omega|\ll\omega_{fi}+\Omega$$

です。第二項はゆっくり位相が蓄積して大きくなりますが、第一項は速く振動し、長い時間で正負が打ち消されます。これが「高速項を捨てる」理由です。単に式を短くする操作ではありません。

ただし、$T$ が非常に短いと周波数を分解できず、高速項も十分に平均化されません。また $|V_{fi}|T/\hbar$ が1に近づくと1次摂動論そのものが破綻します。回転波近似の条件と弱摂動の条件は別々に確認します。

### D. 三つの近似法の保証と弱点

| 方法 | 小ささ・選択の基準 | 得られるもの | 主な破綻の兆候 |
|---|---|---|---|
| 定常摂動論 | 行列要素が準位差より十分小さい | エネルギー・状態の次数展開 | 近接準位、縮退、補正が主項と同程度 |
| 変分法 | 対称性と境界条件を満たす試行状態 | 基底エネルギーの上限 | 試行関数族が狭く、局所構造を表せない |
| 時間依存摂動論 | 遷移確率が十分小さい | 短時間の遷移振幅 | 確率が1へ近づく、長時間のcoherent oscillation |

近似法を選ぶとは、計算手順を選ぶだけでなく、「何が正しいと保証され、どこから疑うべきか」を選ぶことです。

---

## 用語ミニ辞典

| English | 日本語 | 意味 |
|---|---|---|
| anharmonicity | 非調和性 | ポテンシャルが完全な二次関数からずれること |
| variational principle | 変分原理 | 試行状態の期待値が真の基底エネルギー以上になる性質 |
| detuning | 離調 | 外力の周波数と遷移周波数の差 $\Delta$ |
| rotating-wave approximation | 回転波近似 | 共鳴近傍で高速振動する項を無視する近似 |

## 学習チェック

- 摂動論の「小さい」という条件を準位間隔と行列要素で説明できるか。
- 変分エネルギーを最小化する物理的意味を説明できるか。
- 有限時間の遷移確率がsinc関数になる理由を積分から示せるか。
