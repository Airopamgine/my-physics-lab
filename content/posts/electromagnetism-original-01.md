---
title: "【電磁気学I】独自演習：遮蔽ポテンシャル・E×Bドリフト・同軸導体系"
date: 2026-07-12
draft: false
categories: ["電磁気"]
---

> **この教材について**  
> 本ページは、学部電磁気学の標準的な到達目標をもとに独自に作成した演習教材です。大学・担当教員が作成した試験問題の転載ではなく、公式の問題・解答でもありません。問題作成と文章整理には生成AIを補助的に利用し、公開前に内容と計算を確認しています。誤りを見つけた場合はGitHub Issueでお知らせください。詳しくは[制作方針]({{< relref "/policy" >}})をご覧ください。

## この演習の狙い

この演習では、公式を暗記するだけでなく、ベクトル解析と物理的意味を結び付けます。

1. 球対称場で勾配・発散・ガウスの法則を使う。
2. ローレンツ力から荷電粒子の軌道を導出する。
3. 複数導体系を等価回路ではなく電場から理解する。

---

## 問題1：遮蔽された点電荷

誘電率 $\varepsilon_0$ の空間において、原点付近の電位が

$$\phi(r)=\frac{Q}{4\pi\varepsilon_0}\frac{e^{-r/\lambda}}{r}\qquad (r>0)$$

で与えられている。$\lambda>0$ は遮蔽長である。

1. 電場 $\mathbf E(r)$ を求めよ。
2. 半径 $R$ の球面を通る電気力線の総量、すなわち電束を求めよ。
3. $r>0$ に分布する電荷密度 $\rho_{\mathrm s}(r)$ を求めよ。
4. 遮蔽電荷の全量が $-Q$ になることを示し、物理的意味を説明せよ。

### 解答1-1：球対称電位の勾配

球対称なスカラー場では、勾配は動径方向だけを持ちます。

$$\nabla\phi=\frac{d\phi}{dr}\mathbf e_r$$

電場は $\mathbf E=-\nabla\phi$ です。積の微分を丁寧に行うと、

$$\frac{d}{dr}\left(\frac{e^{-r/\lambda}}{r}\right)=-e^{-r/\lambda}\left(\frac{1}{r^2}+\frac{1}{\lambda r}\right)$$

したがって、

$$\boxed{\mathbf E(r)=\frac{Q}{4\pi\varepsilon_0}e^{-r/\lambda}\left(\frac{1}{r^2}+\frac{1}{\lambda r}\right)\mathbf e_r}$$

$Q>0$ なら外向きです。ただし、クーロン場の $1/r^2$ に指数減衰が掛かるため、$r\gg\lambda$ では急速に弱くなります。

### 解答1-2：電束

球面上では電場の大きさが一定で、面積は $4\pi R^2$ です。

$$\Phi_E(R)=\oint\mathbf E\cdot d\mathbf S=4\pi R^2E_r(R)$$

よって、

$$\boxed{\Phi_E(R)=\frac{Q}{\varepsilon_0}e^{-R/\lambda}\left(1+\frac{R}{\lambda}\right)}$$

通常の点電荷なら電束は半径によらず $Q/\varepsilon_0$ です。今回は半径とともに減少します。これは、原点の正電荷を打ち消す符号の電荷が周囲に分布していることを示します。

### 解答1-3：電荷密度

ガウスの法則の微分形

$$\nabla\cdot\mathbf E=\frac{\rho}{\varepsilon_0}$$

を用います。球対称な動径場では、

$$\nabla\cdot(E_r\mathbf e_r)=\frac{1}{r^2}\frac{d}{dr}(r^2E_r)$$

です。計算すると、$r>0$ で

$$\boxed{\rho_{\mathrm s}(r)=-\frac{Q}{4\pi\lambda^2r}e^{-r/\lambda}}$$

となります。負号は、$Q>0$ の中心電荷を周囲の負電荷が遮蔽していることを表します。原点には別に $Q\delta^{(3)}(\mathbf r)$ が存在します。

### 解答1-4：遮蔽電荷の総量

$$Q_{\mathrm s}=\int_0^\infty\rho_{\mathrm s}(r)4\pi r^2dr=-\frac{Q}{\lambda^2}\int_0^\infty re^{-r/\lambda}dr$$

$u=r/\lambda$ とおけば、$\int_0^\infty ue^{-u}du=1$ なので、

$$\boxed{Q_{\mathrm s}=-Q}$$

中心電荷と遮蔽電荷を合わせた全電荷は0です。そのため十分遠方では電場がほとんど見えません。

> **よくある誤り**：$e^{-r/\lambda}$ を定数のように扱い、微分から $1/(\lambda r)$ の項を落とすこと。

---

## 問題2：交差電磁場中の荷電粒子

一様な電場と磁場が

$$\mathbf E=E_0\mathbf e_x,\qquad \mathbf B=B_0\mathbf e_z$$

として存在する。質量 $m$、電荷 $q$ の粒子を $t=0$ に原点から静かに放す。$z$ 方向の運動はないものとする。

1. $v_x,v_y$ の運動方程式を立てよ。
2. 速度 $v_x(t),v_y(t)$ を求めよ。
3. 軌道 $x(t),y(t)$ を求め、時間平均速度を求めよ。
4. ドリフト速度が電荷の符号や質量によらない理由を説明せよ。

### 解答2-1：ローレンツ力の成分

$$m\dot{\mathbf v}=q(\mathbf E+\mathbf v\times\mathbf B)$$

$\mathbf v\times\mathbf B=(v_yB_0,-v_xB_0,0)$ なので、符号付きサイクロトロン角振動数 $\omega_c=qB_0/m$ を用いると、

$$\boxed{\dot v_x=\frac{qE_0}{m}+\omega_cv_y,\qquad \dot v_y=-\omega_cv_x}$$

### 解答2-2：速度

$u_y=v_y+E_0/B_0$ と置くと定数項が消え、

$$\dot v_x=\omega_cu_y,\qquad \dot u_y=-\omega_cv_x$$

となります。初期条件は $v_x(0)=0$、$u_y(0)=E_0/B_0$ です。したがって、

$$\boxed{v_x(t)=\frac{E_0}{B_0}\sin(\omega_ct)}$$

$$\boxed{v_y(t)=\frac{E_0}{B_0}\left[\cos(\omega_ct)-1\right]}$$

### 解答2-3：軌道とドリフト

時間積分して $x(0)=y(0)=0$ を用いると、

$$\boxed{x(t)=\frac{E_0}{B_0\omega_c}\left[1-\cos(\omega_ct)\right]}$$

$$\boxed{y(t)=\frac{E_0}{B_0\omega_c}\sin(\omega_ct)-\frac{E_0}{B_0}t}$$

周期運動部分を1周期で平均すると0になるため、

$$\boxed{\langle\mathbf v\rangle=-\frac{E_0}{B_0}\mathbf e_y=\frac{\mathbf E\times\mathbf B}{B_0^2}}$$

これを $\mathbf E\times\mathbf B$ drift（EクロスBドリフト）と呼びます。

### 解答2-4：なぜ粒子の種類によらないのか

電気力も磁気力も $q$ に比例します。旋回の向きと速さには $q/m$ が現れますが、旋回中心の平均移動ではその因子が打ち消されます。そのため、正電荷と負電荷は逆向きに回転しても、ドリフト方向は同じです。

> **院試接続**：任意の初速度があっても、速度を「旋回速度」と「$\mathbf E\times\mathbf B/B^2$」に分解すれば同じ結論が得られます。プラズマ物理や磁気閉じ込めの基本です。

---

## 問題3：三重同軸導体系

十分長い同軸円筒導体があり、その半径を内側から $a<b<c$ とする。内側導体と外側導体を接地し、中間導体に単位長さ当たりの電荷 $\Lambda$ を与える。誘電率は全領域で $\varepsilon$ とし、端効果を無視する。

1. 領域 $a<r<b$ と $b<r<c$ の電場を求めよ。
2. 中間導体の電位 $V_b$ を求めよ。
3. 中間導体から見た単位長さ当たりの静電容量 $C'$ を求めよ。

### 解答3-1：電荷の分配を未知数として置く

中間導体の電荷が、内側へ向かう分を $\Lambda_1$、外側へ向かう分を $\Lambda_2$ とすると、

$$\Lambda_1+\Lambda_2=\Lambda$$

です。円筒ガウス面を用いれば、電場の大きさは

$$E_1(r)=\frac{\Lambda_1}{2\pi\varepsilon r}\quad(a<r<b),\qquad E_2(r)=\frac{\Lambda_2}{2\pi\varepsilon r}\quad(b<r<c)$$

となります。向きは中間導体から、それぞれ内向き・外向きです。

### 解答3-2：電位条件

内側と外側はいずれも接地されているので、中間導体の電位は左右どちらから積分しても同じです。

$$V_b=\frac{\Lambda_1}{2\pi\varepsilon}\ln\frac{b}{a}=\frac{\Lambda_2}{2\pi\varepsilon}\ln\frac{c}{b}$$

したがって、

$$\Lambda_1=\frac{2\pi\varepsilon V_b}{\ln(b/a)},\qquad \Lambda_2=\frac{2\pi\varepsilon V_b}{\ln(c/b)}$$

です。

### 解答3-3：静電容量

$\Lambda=\Lambda_1+\Lambda_2=C'V_b$ より、

$$\boxed{C'=2\pi\varepsilon\left[\frac{1}{\ln(b/a)}+\frac{1}{\ln(c/b)}\right]}$$

これは、中間導体から2つの接地導体へ伸びる同軸コンデンサーが並列につながった形です。最初から並列公式を使うのではなく、電位が共通で電荷が加算されることから並列性を導くのが重要です。

---

## 用語ミニ辞典

| English | 日本語 | このページでの意味 |
|---|---|---|
| screening | 遮蔽 | 周囲の反対符号の電荷が中心電荷の場を弱めること |
| electric flux | 電束 | ある面を貫く電場の総量 |
| drift | 漂移 | 細かな旋回とは別に、軌道中心が平均的に移動すること |
| coaxial conductor | 同軸導体 | 共通の中心軸を持つ円筒導体 |

## 学習チェック

- $\nabla\phi$ と $\nabla\cdot\mathbf E$ を座標系に合わせて使い分けられるか。
- ローレンツ力の外積の符号を、自分で成分計算できるか。
- 静電容量を $C=Q/V$ へ戻って導出できるか。
