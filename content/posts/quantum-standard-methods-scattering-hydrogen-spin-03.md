---
title: "【量子力学II・典型問題詳解】散乱・水素原子・角運動量・共鳴を一本の方法で解く"
date: 2026-07-13
draft: false
categories: ["量子力学"]
---

> **この教材の位置づけ**  
> 本ページは、量子力学の標準カリキュラムで繰り返し扱われる散乱論、中心力問題、角運動量合成、縮退摂動、二準位共鳴を、独自の問題設定と誘導で再構成した演習です。特定の試験問題の転載、再現、予想問題、公式解答ではありません。標準的な教科書や講義と題材が似るのは、同じ基礎理論から導かれる典型テーマだからです。元の試験画像・年度・固有の設問文は掲載していません。

生成AIは数式整理と検算の補助に利用していますが、解法の選択、説明の重点、最終確認は運営者が行っています。誤りを見つけた場合はGitHub Issueでお知らせください。詳しくは[制作方針]({{< relref "/policy" >}})をご覧ください。

## このページで身につける一本の方法

一見すると、散乱、水素原子、角運動量、摂動は別の章です。しかし試験で問われる操作は共通しています。

1. **境界条件または対称性を先に読む。**
2. **自然な基底を選ぶ。**
3. **無限次元の問題を、必要な部分空間へ落とす。**
4. **規格化、次元、極限、対称性で検算する。**

公式を覚えるより、「なぜこの表示を選ぶと問題が小さくなるのか」を追ってください。

---

## 問題1：GaussianポテンシャルのBorn散乱

質量 $m$、波数 $k$ の粒子が、球対称ポテンシャル

$$V(r)=V_0\exp\left(-\frac{r^2}{a^2}\right)$$

によって弾性散乱される。入射波を $e^{i\mathbf k\cdot\mathbf r}$、散乱状態の漸近形を

$$\psi(\mathbf r)\underset{r\to\infty}{\sim}e^{i\mathbf k\cdot\mathbf r} +f(\theta)\frac{e^{ikr}}{r}$$

とする。Green関数の規約を

$$G^{(+)}(\mathbf r)=-\frac{e^{ikr}}{4\pi r},\qquad (\nabla^2+k^2)G^{(+)}(\mathbf r)=\delta^{(3)}(\mathbf r)$$

とする。

1. Schrödinger方程式を積分方程式へ書き換えよ。
2. 第1 Born近似の散乱振幅を、運動量移行 $\mathbf q=\mathbf k^{\prime}-\mathbf k$ を使って表せ。
3. Gaussian積分を実行し、$f_{\mathrm B}(\theta)$ と微分断面積を求めよ。
4. $ka\ll1$ と $ka\gg1$ で角分布がどう変わるか説明せよ。

### 解法を選ぶ理由

球対称だからといって、最初から部分波展開が常に最短とは限りません。弱いポテンシャルの第1近似では、Born振幅がポテンシャルの3次元Fourier変換になるため、Gaussianは積分表示の方が圧倒的に速く解けます。

### 解答1-1：微分方程式から積分方程式へ

定常Schrödinger方程式は

$$\left(\nabla^2+k^2\right)\psi(\mathbf r) =\frac{2m}{\hbar^2}V(\mathbf r)\psi(\mathbf r)$$

です。右辺を源とみなし、外向き波の境界条件を含む $G^{(+)}$ を作用させると、

$$\boxed{ \psi(\mathbf r)=e^{i\mathbf k\cdot\mathbf r} +\frac{2m}{\hbar^2}\int d^3r^{\prime}\, G^{(+)}(\mathbf r-\mathbf r^{\prime})V(\mathbf r^{\prime})\psi(\mathbf r^{\prime}) }$$

を得ます。

ここで第1項は斉次方程式

$$(\nabla^2+k^2)e^{i\mathbf k\cdot\mathbf r}=0$$

を満たす入射波です。第2項へ $(\nabla^2+k^2)$ を作用させれば、Green関数の定義から元の右辺が戻ります。

> **符号の検算**：Green関数の符号と積分方程式の符号は組です。別の規約を途中で混ぜると、散乱振幅全体の符号が反転します。

### 解答1-2：遠方極限とBorn近似

$r\gg r^{\prime}$ では

$$|\mathbf r-\mathbf r^{\prime}|\simeq r-\hat{\mathbf r}\cdot\mathbf r^{\prime}$$

なので、

$$G^{(+)}(\mathbf r-\mathbf r^{\prime}) \simeq-\frac{e^{ikr}}{4\pi r}e^{-i\mathbf k^{\prime}\cdot\mathbf r^{\prime}}, \qquad \mathbf k^{\prime}=k\hat{\mathbf r}$$

です。したがって厳密な散乱振幅は

$$f(\theta)=-\frac{m}{2\pi\hbar^2} \int d^3r^{\prime}\,e^{-i\mathbf k^{\prime}\cdot\mathbf r^{\prime}}V(\mathbf r^{\prime})\psi(\mathbf r^{\prime})$$

です。第1 Born近似では積分内の未知の厳密波動関数を入射波で置き換えます。

$$\psi(\mathbf r^{\prime})\simeq e^{i\mathbf k\cdot\mathbf r^{\prime}}$$

よって、

$$\boxed{ f_{\mathrm B}(\mathbf q) =-\frac{m}{2\pi\hbar^2} \int d^3r\,e^{-i\mathbf q\cdot\mathbf r}V(r) },\qquad q=2k\sin\frac{\theta}{2}$$

となります。Born近似とは「散乱後の波を無視する」ことではなく、散乱を生む源の中だけで $\psi$ を入射波に置き換える近似です。

### 解答1-3：Fourier変換を実行する

3次元Gaussian積分

$$\int d^3r\, \exp\left(-\frac{r^2}{a^2}\right)e^{-i\mathbf q\cdot\mathbf r} =\pi^{3/2}a^3\exp\left(-\frac{a^2q^2}{4}\right)$$

より、

$$\boxed{ f_{\mathrm B}(\theta) =-\frac{\sqrt{\pi}\,mV_0a^3}{2\hbar^2} \exp\left[-a^2k^2\sin^2\left(\frac{\theta}{2}\right)\right] }$$

です。したがって、

$$\boxed{ \frac{d\sigma}{d\Omega} =\frac{\pi m^2V_0^2a^6}{4\hbar^4} \exp\left[-2a^2k^2\sin^2\left(\frac{\theta}{2}\right)\right] }$$

となります。

断面積では $V_0$ の符号が消えます。第1 Born近似の微分断面積だけから、同じ形で符号だけ異なる引力と斥力を区別できないことも重要です。

### 解答1-4：低エネルギー極限と前方散乱

$ka\ll1$ では指数部がほぼ1なので、角分布はほぼ等方的です。粒子の波長がポテンシャルの空間的広がりより十分長く、細かな形を分解できないからです。

$ka\gg1$ では $\theta\neq0$ で指数関数が急速に小さくなり、前方へ集中します。これはFourier変換の一般則で、実空間で広い構造ほど運動量空間で狭い分布を持ちます。

### 典型的な誤答

- $q=k\sin\theta$ としてしまう。弾性散乱では $q=2k\sin(\theta/2)$ です。
- 振幅 $f$ と断面積 $|f|^2$ を混同する。
- Born近似の適用条件を「低エネルギー」と決めつける。一般にはポテンシャル強度、到達時間、位相変化などを含む弱散乱条件です。

---

## 問題2：水素原子の束縛状態と級数の打切り

Coulombポテンシャル

$$V(r)=-\frac{e^2}{4\pi\varepsilon_0r}$$

中の束縛状態 $E<0$ を考える。動径波動関数を $u(r)=rR(r)$ とし、

$$a_0=\frac{4\pi\varepsilon_0\hbar^2}{me^2},\qquad \kappa=\frac{\sqrt{-2mE}}{\hbar},\qquad \rho=2\kappa r$$

と定義する。

1. $r\to0$ と $r\to\infty$ の漸近形を求めよ。
2. $u(\rho)=\rho^{l+1}e^{-\rho/2}v(\rho)$ とおき、$v$ の方程式を導け。
3. 級数が打ち切られる条件からエネルギー固有値を導け。
4. 基底状態の $R_{10}(r)$ を規格化せよ。

### 解法を選ぶ理由

微分方程式をいきなり級数展開すると、発散する主要因が係数の中に隠れます。原点の遠心力と無限遠の指数減衰を先に取り出すと、残りの級数が「なぜ打ち切られる必要があるか」を見通せます。

### 解答2-1：境界条件が形を決める

動径方程式は

$$\frac{d^2u}{dr^2} +\left[ -\kappa^2+\frac{2}{a_0r}-\frac{l(l+1)}{r^2} \right]u=0$$

です。

原点近くでは $r^{-2}$ 項が支配的なので $u\sim r^s$ とおくと、

$$s(s-1)-l(l+1)=0$$

より $s=l+1$ または $s=-l$ です。後者は原点で特異になるため、

$$u(r)\sim r^{l+1}$$

を選びます。

無限遠では $-\kappa^2$ が支配し、

$$u(r)\sim e^{\pm\kappa r}$$

です。平方可積分性から $e^{-\kappa r}$ を選びます。

### 解答2-2：主要な漸近形を外す

代入と整理により、

$$\boxed{ \rho\frac{d^2v}{d\rho^2} +(2l+2-\rho)\frac{dv}{d\rho} +\left(\frac{1}{\kappa a_0}-l-1\right)v=0 }$$

を得ます。これは陪Laguerre型の方程式です。

$v=\sum_{j=0}^{\infty}c_j\rho^j$ とおくと、十分大きい $j$ で級数は指数関数 $e^\rho$ に近い成長を含みます。外側に $e^{-\rho/2}$ を掛けていても、全体が $e^{+\rho/2}$ となれば規格化できません。

### 解答2-3：打切り条件が量子化条件になる

級数を有限次数 $n_r$ で止めるには、

$$\frac{1}{\kappa a_0}-l-1=n_r,\qquad n_r=0,1,2,\ldots$$

でなければなりません。主量子数を

$$n=n_r+l+1$$

と定義すると、

$$\kappa=\frac{1}{na_0}$$

です。したがって、

$$\boxed{ E_n=-\frac{\hbar^2}{2ma_0^2}\frac{1}{n^2} =-\frac{m}{2\hbar^2} \left(\frac{e^2}{4\pi\varepsilon_0}\right)^2\frac{1}{n^2} }$$

を得ます。

量子化は「整数を仮定した」から生じたのではありません。規格化不能な無限級数を排除する境界条件が、係数の打切りという整数条件へ変換されたのです。

### 解答2-4：基底状態

$n=1,l=0,n_r=0$ では $v$ は定数なので、

$$R_{10}(r)=A e^{-r/a_0}$$

です。球面調和関数 $Y_{00}=1/\sqrt{4\pi}$ とし、動径部分を

$$\int_0^\infty |R_{10}(r)|^2r^2dr=1$$

で規格化します。

$$|A|^2\int_0^\infty r^2e^{-2r/a_0}dr =|A|^2\frac{a_0^3}{4}=1$$

より、

$$\boxed{R_{10}(r)=2a_0^{-3/2}e^{-r/a_0}}$$

です。全波動関数は

$$\boxed{\psi_{100}(\mathbf r) =\frac{1}{\sqrt{\pi a_0^3}}e^{-r/a_0}}$$

となります。

### 検算

- $R$ の次元は長さの $-3/2$ 乗。
- $E_n$ は $n$ が大きいほど0へ下から近づく。
- 原点で $u=rR\to0$。
- $l\le n-1$ は $n_r\ge0$ から自動的に出る。

---

## 問題3：$l=1$ と $s=1/2$ の角運動量合成

軌道角運動量 $l=1$ とスピン $s=1/2$ を合成する。

1. 可能な全角運動量 $j$ を求め、状態数を確認せよ。
2. 最高ウェイト状態から降下演算子を使い、$|3/2,1/2\rangle$ を求めよ。
3. 直交性から $|1/2,1/2\rangle$ を求めよ。
4. 得られた状態が $J_z$ の正しい固有値を持つことを確認せよ。

### 解答3-1：先に次元を数える

角運動量の三角条件から、

$$j=|l-s|,\ldots,l+s$$

なので、

$$j=\frac32,\frac12$$

です。直積空間の次元は

$$(2l+1)(2s+1)=3\times2=6$$

であり、合成後は

$$(2\times\frac32+1)+(2\times\frac12+1)=4+2=6$$

です。状態の取りこぼしも重複もありません。

### 解答3-2：最高ウェイトから下げる

最高ウェイトは一通りしかないので、

$$\left|\frac32,\frac32\right\rangle=|1,1\rangle|\uparrow\rangle$$

です。全降下演算子 $J_-=L_-+S_-$ を作用させます。

左辺は

$$J_-\left|\frac32,\frac32\right\rangle =\hbar\sqrt3\left|\frac32,\frac12\right\rangle$$

です。右辺は

$$\left(L_-+S_-\right)|1,1\rangle|\uparrow\rangle =\hbar\sqrt2|1,0\rangle|\uparrow\rangle +\hbar|1,1\rangle|\downarrow\rangle$$

なので、

$$\boxed{ \left|\frac32,\frac12\right\rangle =\sqrt{\frac23}|1,0\rangle|\uparrow\rangle +\sqrt{\frac13}|1,1\rangle|\downarrow\rangle }$$

です。

### 解答3-3：同じ $m=1/2$ 空間の直交状態

$m=1/2$ を持つ積基底は

$$|1,0\rangle|\uparrow\rangle,\qquad |1,1\rangle|\downarrow\rangle$$

の二つです。上の $j=3/2$ 状態に直交し、規格化された組合せを取れば、

$$\boxed{ \left|\frac12,\frac12\right\rangle =\sqrt{\frac13}|1,0\rangle|\uparrow\rangle -\sqrt{\frac23}|1,1\rangle|\downarrow\rangle }$$

です。全体位相は観測に影響しないため、両辺へ $-1$ を掛けた表現も同じ物理状態です。

負の $m$ の状態も同様に、

$$\left|\frac32,-\frac12\right\rangle =\sqrt{\frac23}|1,0\rangle|\downarrow\rangle +\sqrt{\frac13}|1,-1\rangle|\uparrow\rangle$$

$$\left|\frac12,-\frac12\right\rangle =\sqrt{\frac23}|1,-1\rangle|\uparrow\rangle -\sqrt{\frac13}|1,0\rangle|\downarrow\rangle$$

と取れます。

### 解答3-4：$J_z$ の検算

たとえば $|1,0\rangle|\uparrow\rangle$ では

$$(m_l+m_s)\hbar =\left(0+\frac12\right)\hbar =\frac{\hbar}{2}$$

です。$|1,1\rangle|\downarrow\rangle$ でも

$$(1-\frac12)\hbar=\frac{\hbar}{2}$$

です。したがって線形結合全体が $J_z$ の固有値 $\hbar/2$ を持ちます。

> **重要**：$J_z$ の固有値が同じだけでは $j$ は決まりません。同じ $m$ 部分空間の中で $J^2$ を対角化する操作が、Clebsch-Gordan係数を選びます。降下演算子と直交性は、その対角化を行列を書かずに実行しているのです。

---

## 問題4：水素原子 $n=2$ の線形Stark効果

一様電場 $\mathcal E\mathbf e_z$ 中の水素原子を考え、摂動を

$$H^{\prime}=e\mathcal E z$$

とする。ここで $e>0$ は電気素量であり、この符号規約を最後まで使う。$n=2$ の縮退部分空間

$$\{|2s\rangle,|2p,0\rangle,|2p,+1\rangle,|2p,-1\rangle\}$$

で1次のエネルギー補正を求めよ。ただし位相を適切に選び、

$$\langle2s|z|2p,0\rangle=3a_0$$

としてよい。

### 解法を選ぶ理由

非縮退摂動論の公式 $\Delta E^{(1)}=\langle n|H^{\prime}|n\rangle$ を四状態へ個別に使うと、対角要素はすべて0になり、「補正なし」という誤答になります。縮退しているときは、摂動が選ぶ新しい固有状態を部分空間内で先に求めなければなりません。

### 解答4-1：対称性で行列要素を減らす

$z=r\cos\theta$ は奇パリティを持つため、同じパリティ同士の対角要素は0です。

$$\langle2s|z|2s\rangle=0,\qquad \langle2p,m|z|2p,m^{\prime}\rangle=0$$

です。また $z$ は球面テンソルの $q=0$ 成分なので $\Delta m=0$ です。したがって $|2s\rangle$ と結合できるのは $|2p,0\rangle$ だけです。

### 解答4-2：縮退部分空間で対角化する

上の基底順序で摂動行列は

$$H^{\prime}_{n=2} =3ea_0\mathcal E \begin{pmatrix} 0&1&0&0\\ 1&0&0&0\\ 0&0&0&0\\ 0&0&0&0 \end{pmatrix}$$

です。したがって固有状態と1次補正は

$$\boxed{ |+\rangle=\frac{|2s\rangle+|2p,0\rangle}{\sqrt2}, \qquad \Delta E_+^{(1)}=+3ea_0\mathcal E }$$

$$\boxed{ |-\rangle=\frac{|2s\rangle-|2p,0\rangle}{\sqrt2}, \qquad \Delta E_-^{(1)}=-3ea_0\mathcal E }$$

です。$|2p,\pm1\rangle$ は1次では補正0のままです。

電場が縮退を解くとは、元の $|2s\rangle$ と $|2p,0\rangle$ が別々に移動するのではありません。電場中で自然な定常状態が、その対称・反対称結合へ変わるという意味です。

### 基底状態で1次補正が0になる理由

$1s$ 状態は偶パリティ、$z$ は奇パリティなので、

$$\langle1s|z|1s\rangle=0$$

です。これは「積分したら偶然0」ではなく、空間反転対称性の帰結です。ただし2次補正は一般に0ではなく、基底状態は誘起双極子を持ち得ます。

### 典型的な誤答

- 縮退しているのに対角期待値だけを計算する。
- $|2p,\pm1\rangle$ まで $|2s\rangle$ と混ざるとする。$\Delta m=0$ を確認します。
- 行列要素の符号を物理的な準位順と混同する。基底状態の位相を反転すると非対角要素の符号も変わりますが、固有値集合は変わりません。

---

## 問題5：回転磁場によるスピン共鳴

二準位系を

$$H_0=\frac{\hbar\omega_0}{2}\sigma_z$$

で表し、$xy$ 平面内を角振動数 $\omega$ で回転する磁場による相互作用を

$$H_1(t)=\frac{\hbar\Omega_1}{2} \left(\sigma_x\cos\omega t+\sigma_y\sin\omega t\right)$$

とする。初期状態を $|\downarrow\rangle$ とする。

1. $H_1(t)$ の行列表示を求めよ。
2. 回転座標系で時間依存性を消せ。
3. 遷移確率 $P_{\downarrow\to\uparrow}(t)$ を求め、共鳴条件を説明せよ。

### 解答5-1：回転場は位相を持つ非対角結合

Pauli行列から、

$$\sigma_x\cos\omega t+\sigma_y\sin\omega t = \begin{pmatrix} 0&e^{-i\omega t}\\ e^{i\omega t}&0 \end{pmatrix}$$

です。したがって、

$$\boxed{ H_1(t)=\frac{\hbar\Omega_1}{2} \begin{pmatrix} 0&e^{-i\omega t}\\ e^{i\omega t}&0 \end{pmatrix} }$$

です。対角成分が0なのは、この摂動が $z$ 基底のエネルギーを直接ずらすより、二状態を結合する役割を持つことを示します。

### 解答5-2：回転座標系

ユニタリ変換

$$U(t)=\exp\left(-\frac{i\omega t}{2}\sigma_z\right)$$

を用い、$|\psi(t)\rangle=U(t)|\phi(t)\rangle$ とおきます。回転系のHamiltonianは

$$H_{\mathrm{rot}} =U^\dagger HU-i\hbar U^\dagger\dot U$$

であり、

$$\boxed{ H_{\mathrm{rot}} =\frac{\hbar}{2} \left(\Delta\sigma_z+\Omega_1\sigma_x\right) },\qquad \Delta=\omega_0-\omega$$

となります。

時間依存Hamiltonianを直接積分する代わりに、座標系を場と一緒に回すことで、一定の有効磁場中の歳差運動へ変換しました。

### 解答5-3：Rabi振動

有効角振動数を

$$\Omega_{\mathrm R}=\sqrt{\Omega_1^2+\Delta^2}$$

とすると、

$$\boxed{ P_{\downarrow\to\uparrow}(t) =\frac{\Omega_1^2}{\Omega_1^2+\Delta^2} \sin^2\left(\frac{\Omega_{\mathrm R}t}{2}\right) }$$

です。

共鳴条件は

$$\boxed{\omega=\omega_0}$$

すなわち $\Delta=0$ です。このとき振幅の前因子が1となり、

$$P_{\downarrow\to\uparrow}(t) =\sin^2\left(\frac{\Omega_1t}{2}\right)$$

なので、適切な時間で完全反転できます。

共鳴とは「振動数が近いと何となく大きくなる」現象ではありません。回転系では、離調 $\Delta$ が有効磁場の $z$ 成分として残り、回転軸が横方向から傾くため、初期状態を反対極まで運べなくなると理解できます。

### 摂動論との接続

短時間または弱結合では $\sin x\simeq x$ を使い、

$$P_{\downarrow\to\uparrow}(t) \simeq \frac{\Omega_1^2t^2}{4}$$

です。しかし共鳴で長時間追うと、1次振幅をそのまま延長した近似は確率が1を超え得ます。厳密な二準位解がRabi振動として確率を0と1の間に保つのは、ユニタリ時間発展を保っているからです。

---

## 五つの問題をつなぐ概念地図

| 問題 | 最初に使った情報 | 選んだ表示 | 問題が小さくなった理由 |
|---|---|---|---|
| 散乱 | 外向き波の境界条件 | Green関数・運動量移行 | Born振幅がFourier変換になる |
| 水素原子 | 原点と無限遠の正則性 | 無次元動径座標 | 発散因子を先に分離できる |
| 角運動量合成 | 回転対称性 | 結合基底 | $J^2,J_z$ を同時に対角化できる |
| Stark効果 | パリティと縮退 | $n=2$ 部分空間 | 4次元行列の2次元ブロックだけ残る |
| スピン共鳴 | 周期性 | 回転座標系 | 時間依存問題が定数行列になる |

共通するのは、計算量で押し切る前に、境界条件・対称性・基底を選んでいることです。量子力学の試験では、公式の記憶より、この選択の理由を説明できるかが得点差になります。

## 総合チェック問題

1. Born振幅がポテンシャルのFourier変換になるのは、どの近似をどこへ入れた結果か。
2. 水素原子の整数 $n$ は、どの物理条件から生まれたか。
3. 同じ $m=1/2$ を持つ二状態を、$j=3/2$ と $j=1/2$ に分ける観測量は何か。
4. Stark効果で非縮退摂動論が失敗する理由は何か。
5. スピン共鳴の離調 $\Delta$ は、回転系でどのような幾何学的意味を持つか。

### 総合チェック解答

1. 積分方程式の源 $V\psi$ の中で、厳密な $\psi$ を入射平面波へ置き換えた結果です。
2. 原点で正則かつ無限遠で平方可積分という境界条件が、級数の打切り条件を要求した結果です。
3. $J^2$ です。$J_z$ だけでは同じ $m$ の状態を区別できません。
4. 摂動が縮退部分空間内の状態を混合するため、元の基底状態を個別に固有状態として扱えないからです。
5. 有効磁場の $z$ 成分です。離調があると回転軸が傾き、完全反転の振幅が下がります。

## 学問を深めるための問い

### 1. Green関数とCFDのPoisson方程式

散乱のGreen関数は、点源への応答を重ね合わせて解を作ります。非圧縮流の圧力Poisson方程式も、境界条件に合う逆演算子を通して源から場を再構成します。方程式が同じ形でも、放射条件と壁面条件ではGreen関数が異なる点を考えてみてください。

### 2. 量子化と数値固有値問題

水素原子では無限遠で発散しない条件が離散固有値を選びました。数値計算でも、境界条件を含む離散演算子の行列式が0になる値だけが固有モードです。解析的な級数打切りと行列固有値計算は、同じ境界値問題の二つの表現です。

### 3. 共鳴と安定性

共鳴は外力の振動数と内部の固有振動数の関係を問題にします。一方、数値流体の安定性では離散時間発展の増幅因子を調べます。どちらも、位相が反復ごとにどう蓄積するかを見る点でつながっています。ただし物理的増幅と数値的不安定を同一視してはいけません。

## 参考文献

- J. J. Sakurai and Jim Napolitano, *Modern Quantum Mechanics*
- David J. Griffiths and Darrell F. Schroeter, *Introduction to Quantum Mechanics*
- Claude Cohen-Tannoudji, Bernard Diu, and Franck Laloë, *Quantum Mechanics*
- Richard P. Feynman, Robert B. Leighton, and Matthew Sands, *The Feynman Lectures on Physics, Vol. III*

## 公開前の自己監査

- 特定年度の試験文、配点、問題番号、固有の数値設定を転載していない。
- 散乱ポテンシャルをGaussianへ変更し、Fourier変換と極限解析を追加した。
- 角運動量は降下演算子と直交性から独立に導出した。
- 水素原子は境界条件から量子化条件を導いた。
- 縮退摂動は部分空間の対角化として説明した。
- 共鳴は時間依存摂動の公式暗記ではなく、回転座標系から導いた。
- 元画像や配布用資料を掲載していない。
