---
title: "【統計力学III】独自演習：低次元フォノン・回転子・一次元Ising模型"
date: 2026-07-12
draft: false
categories: ["統計力学"]
---

> **この教材について**  
> 本ページは、学部統計力学の標準的な到達目標をもとに独自に作成した演習教材です。大学・担当教員が作成した試験問題の転載ではなく、公式の問題・解答でもありません。問題作成と文章整理には生成AIを補助的に利用し、公開前に内容と計算を確認しています。誤りを見つけた場合はGitHub Issueでお知らせください。詳しくは[制作方針]({{< relref "/policy" >}})をご覧ください。

## この演習の狙い

1. 状態密度から低温比熱の温度依存性を導く。
2. 分配関数の高温・低温極限を使い分ける。
3. 転送行列から一次元系の熱力学と相関を求める。

---

## 問題1：$d$ 次元の音響フォノン

$d$ 次元の体積 $V_d$ を持つ固体を考える。音響フォノンの分散関係を $\omega=c|\mathbf k|$ とし、同じ音速を持つ分枝が $g$ 本あるとする。低温ではDebye cutoffを無限大へ延長してよい。

1. 角周波数に関する状態密度 $D(\omega)$ を求めよ。
2. 熱励起による内部エネルギー $U(T)$ を求めよ。
3. 低温比熱が $C_V\propto T^d$ となることを示せ。
4. $d=2$ と $d=3$ の違いを説明せよ。

### 解答1-1：$k$ 空間の殻を数える

$d$ 次元の周期境界条件では、1状態が占める $k$ 空間体積は $(2\pi)^d/V_d$ です。半径 $k$、厚さ $dk$ の球殻体積は $S_{d-1}k^{d-1}dk$ です。ここで

$$S_{d-1}=\frac{2\pi^{d/2}}{\Gamma(d/2)}$$

は $d$ 次元単位球の表面積です。したがって、

$$D(\omega)d\omega=g\frac{V_d}{(2\pi)^d}S_{d-1}k^{d-1}dk$$

$k=\omega/c$、$dk=d\omega/c$ より、

$$\boxed{D(\omega)=g\frac{V_dS_{d-1}}{(2\pi)^dc^d}\omega^{d-1}}$$

### 解答1-2：Bose分布による内部エネルギー

零点エネルギーは温度に依存しないので、比熱には寄与しません。熱励起部分は

$$U(T)=\int_0^\infty D(\omega)\frac{\hbar\omega}{e^{\beta\hbar\omega}-1}d\omega$$

です。$x=\beta\hbar\omega$ と置くと、

$$U(T)=g\frac{V_dS_{d-1}}{(2\pi)^dc^d}\frac{(k_BT)^{d+1}}{\hbar^d}\int_0^\infty\frac{x^d}{e^x-1}dx$$

積分公式

$$\int_0^\infty\frac{x^d}{e^x-1}dx=\Gamma(d+1)\zeta(d+1)$$

を用いて、

$$\boxed{U(T)=g\frac{V_dS_{d-1}\Gamma(d+1)\zeta(d+1)}{(2\pi)^dc^d\hbar^d}(k_BT)^{d+1}}$$

### 解答1-3：比熱

温度微分により、

$$\boxed{C_V=(d+1)g\frac{V_dS_{d-1}\Gamma(d+1)\zeta(d+1)k_B}{(2\pi)^dc^d\hbar^d}(k_BT)^d}$$

したがって、

$$\boxed{C_V\propto T^d}$$

です。べき指数は、分散関係だけでなく空間次元にも依存します。

### 解答1-4：2次元と3次元

- 2次元膜の線形音響モード：$C_V\propto T^2$
- 3次元固体の線形音響モード：$C_V\propto T^3$

低温比熱の測定から、有効次元や低エネルギー励起の分散関係を推定できます。

> **院試接続**：一般に $\omega\propto k^s$ なら $D(\omega)\propto\omega^{d/s-1}$ となり、Bose励起の比熱は $C_V\propto T^{d/s}$ です。

---

## 問題2：量子剛体回転子の自由度凍結

異核二原子分子を剛体回転子とみなし、回転準位を

$$\varepsilon_J=k_B\Theta_rJ(J+1),\qquad g_J=2J+1\qquad(J=0,1,2,\ldots)$$

とする。$\Theta_r$ は特性回転温度である。

1. 回転分配関数を書け。
2. $T\gg\Theta_r$ で $Z_{\mathrm rot}\simeq T/\Theta_r$ を示し、高温比熱を求めよ。
3. $T\ll\Theta_r$ で最低2準位だけを残し、低温比熱を求めよ。
4. 「自由度が凍結する」とは何を意味するか説明せよ。

### 解答2-1：分配関数

$$\boxed{Z_{\mathrm rot}=\sum_{J=0}^\infty(2J+1)e^{-(\Theta_r/T)J(J+1)}}$$

### 解答2-2：高温極限

$a=\Theta_r/T\ll1$ と置き、和を積分で近似します。

$$Z_{\mathrm rot}\simeq\int_0^\infty(2J+1)e^{-aJ(J+1)}dJ$$

$u=J(J+1)$、$du=(2J+1)dJ$ とすれば、

$$\boxed{Z_{\mathrm rot}\simeq\int_0^\infty e^{-au}du=\frac{1}{a}=\frac{T}{\Theta_r}}$$

したがって、

$$U_{\mathrm rot}=k_BT^2\frac{\partial\ln Z_{\mathrm rot}}{\partial T}=k_BT$$

$$\boxed{C_{V,\mathrm rot}=k_B}$$

これは回転の二つの二次形式自由度が、それぞれ $k_B/2$ の比熱を持つ古典的等分配則と一致します。

### 解答2-3：低温極限

$J=0$ のエネルギーは0、縮退度は1です。$J=1$ のエネルギーは $2k_B\Theta_r$、縮退度は3です。よって、

$$Z_{\mathrm rot}\simeq1+3e^{-2\Theta_r/T}$$

低温では指数項が非常に小さいので、

$$U_{\mathrm rot}\simeq6k_B\Theta_re^{-2\Theta_r/T}$$

したがって、

$$\boxed{C_{V,\mathrm rot}\simeq12k_B\left(\frac{\Theta_r}{T}\right)^2e^{-2\Theta_r/T}}$$

$T\to0$ で比熱は指数関数的に0へ近づきます。

### 解答2-4：自由度の凍結

古典論では連続的に任意の小さな回転エネルギーを与えられます。しかし量子論では、基底状態から第1励起状態へ移るために $2k_B\Theta_r$ が必要です。熱エネルギー $k_BT$ がこの間隔より小さいと、ほぼすべての分子が基底状態にとどまり、回転自由度がエネルギーを吸収できません。これをfreeze-out（自由度の凍結）と呼びます。

> **注意**：同核二原子分子では核スピン統計により、許される $J$ の偶奇や重みが変わることがあります。ここでは異核分子なので、その制限を入れていません。

---

## 問題3：一次元Ising模型と相関長

周期境界条件 $\sigma_{N+1}=\sigma_1$ を持つ一次元Ising模型

$$H=-J\sum_{i=1}^N\sigma_i\sigma_{i+1},\qquad \sigma_i=\pm1,\qquad J>0$$

を外部磁場0で考える。

1. 転送行列とその固有値を求めよ。
2. 熱力学極限で1スピン当たりの自由エネルギーを求めよ。
3. 内部エネルギーと比熱を求めよ。
4. 相関関数 $\langle\sigma_0\sigma_r\rangle$ と相関長 $\xi$ を求め、有限温度相転移がない理由を説明せよ。

### 解答3-1：転送行列

隣接スピン対のBoltzmann重みを行列要素とすると、

$$\mathbf T=\begin{pmatrix}e^{\beta J}&e^{-\beta J}\\e^{-\beta J}&e^{\beta J}\end{pmatrix}$$

固有ベクトル $(1,1)^T$ と $(1,-1)^T$ に対応して、

$$\boxed{\lambda_+=2\cosh(\beta J),\qquad\lambda_-=2\sinh(\beta J)}$$

です。

### 解答3-2：自由エネルギー

分配関数は

$$Z_N=\operatorname{Tr}\mathbf T^N=\lambda_+^N+\lambda_-^N$$

です。有限温度では $\lambda_+>\lambda_-$ なので、$N\to\infty$ で最大固有値だけが残ります。

$$\boxed{f=-k_BT\ln\left[2\cosh(\beta J)\right]}$$

### 解答3-3：内部エネルギーと比熱

1スピン当たりの内部エネルギーは

$$u=-\frac{\partial\ln\lambda_+}{\partial\beta}=-J\tanh(\beta J)$$

です。さらに、

$$\boxed{c_V=\frac{\partial u}{\partial T}=k_B(\beta J)^2\operatorname{sech}^2(\beta J)}$$

$T\to0$ でも $T\to\infty$ でも比熱は0で、中間温度に滑らかな極大を持ちます。発散はしません。

### 解答3-4：相関関数と相関長

転送行列の二つの固有値の比から、

$$\boxed{\langle\sigma_0\sigma_r\rangle=\left(\frac{\lambda_-}{\lambda_+}\right)^r=[\tanh(\beta J)]^r}$$

これを $e^{-r/\xi}$ と比較すると、

$$\boxed{\xi=-\frac{1}{\ln[\tanh(\beta J)]}}$$

有限の $T>0$ では $0<\tanh(\beta J)<1$ なので、$\xi$ は有限です。遠く離れたスピンの相関は指数関数的に消え、長距離秩序は形成されません。$T\to0$ でのみ $\xi\to\infty$ となります。

別の見方では、ドメイン壁1個のエネルギーコストは有限の $2J$ です。一方、壁を置ける位置の数は系の長さとともに増えるため、任意の有限温度でドメイン壁が熱励起され、長距離秩序を切断します。

---

## 用語ミニ辞典

| English | 日本語 | 意味 |
|---|---|---|
| density of states | 状態密度 | 単位エネルギー・周波数区間に存在する状態数 |
| cutoff | 切断 | 模型で許す波数・周波数の上限 |
| freeze-out | 自由度の凍結 | 準位間隔が熱エネルギーより大きく、励起できない状態 |
| transfer matrix | 転送行列 | 隣接自由度のBoltzmann重みを行列で表す方法 |
| correlation length | 相関長 | 相関が $1/e$ 程度へ減衰する距離尺度 |

## 学習チェック

- $k$ 空間の状態数から状態密度を導けるか。
- 高温では和を積分に、低温では最低準位だけに近似できるか。
- 転送行列の最大固有値が自由エネルギーを決める理由を説明できるか。
