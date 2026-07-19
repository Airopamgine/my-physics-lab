---
title: "電磁場テンソル"
date: 2026-07-20T00:20:00+09:00
draft: false
categories: ["相対性理論"]
---

> **この教材について**  
> 相対性理論で繰り返し問われる論点を土台に、問い方・構成・応用例を一から組み直した独自演習です。試験問題の転載や公式解答ではありません。符号規約を明示し、成分表示とベクトル表示を相互に検算しています。詳しくは[制作方針]({{< relref "/policy" >}})をご覧ください。

## このページで大切にすること

電場と磁場は、相対論では別々の実体ではありません。一つの電磁場テンソルを、異なる慣性系の時間方向と空間方向へ分解した成分です。

この見方を身につけると、次の事柄が一本につながります。

- スカラーポテンシャルとベクトルポテンシャルは四元ポテンシャルになる。
- 電荷密度と電流密度は四元電流になる。
- Gaussの法則とAmpère–Maxwellの法則は一つのテンソル方程式になる。
- 磁場は、別の慣性系では電場の一部として現れ得る。

### 本ページの符号規約

$$x^\mu=(ct,x,y,z),\qquad \eta_{\mu\nu}=\mathrm{diag}(-1,1,1,1)$$

$$A^\mu=\left(\frac{\phi}{c},\mathbf A\right),\qquad A_\mu=\left(-\frac{\phi}{c},\mathbf A\right)$$

$$\partial_\mu=\frac{\partial}{\partial x^\mu},\qquad F_{\mu\nu}=\partial_\mu A_\nu-\partial_\nu A_\mu$$

とします。教科書によって計量や $F_{\mu\nu}$ の定義の符号が違うため、式だけを別の規約へ移植しないことが重要です。

---

## 独自演習

四元電流を

$$j^\mu=(c\rho,\mathbf j)$$

とする。

1. $F_{0i}$ と $F_{ij}$ をポテンシャルから計算し、$\mathbf E=-\nabla\phi-\partial_t\mathbf A$、$\mathbf B=\nabla\times\mathbf A$ が得られることを示せ。
2. $F^{\mu\nu}$ の行列表現を書け。特に $F_{13}$ が磁場のどの成分に対応するか確認せよ。
3. $x$ 方向のローレンツ変換で $\rho$ と $j_x$ がどう混ざるか求め、有限な電荷分布の全電荷が不変になることを説明せよ。
4. 共変なMaxwell方程式

   $$\partial_\nu F^{\mu\nu}=\mu_0j^\mu$$

   から、Gaussの法則とAmpère–Maxwellの法則を導け。
5. Bianchi恒等式から残り二つのMaxwell方程式を得よ。
6. $S$ で $\mathbf E=(0,E_0,0)$、$\mathbf B=\mathbf0$ のとき、$x$ 方向へ速度 $v$ で動く $S'$ での場を求め、電磁場の不変量を検算せよ。

### 出題意図

テンソル記法を「添字を増やして難しくした表現」にしないことが目標です。各添字の式が、既知のベクトル方程式へ戻ることを一成分ずつ確かめます。

---

## 解答1：ポテンシャルから場を取り出す

まず時間と空間が混ざる成分を計算します。$\partial_0=(1/c)\partial_t$、$A_0=-\phi/c$ なので、

$$F_{0i}=\partial_0A_i-\partial_iA_0$$

$$=\frac{1}{c}\frac{\partial A_i}{\partial t}+\frac{1}{c}\frac{\partial\phi}{\partial x^i}$$

です。電場の定義

$$E_i=-\frac{\partial\phi}{\partial x^i}-\frac{\partial A_i}{\partial t}$$

と比べると、

$$\boxed{F_{0i}=-\frac{E_i}{c}}$$

です。添字を上げると $\eta^{00}=-1$ が一度掛かるため、

$$\boxed{F^{0i}=\frac{E_i}{c}}$$

となります。

空間成分は

$$F_{ij}=\partial_iA_j-\partial_jA_i$$

です。たとえば

$$F_{12}=\partial_xA_y-\partial_yA_x=B_z$$

$$F_{23}=\partial_yA_z-\partial_zA_y=B_x$$

$$F_{31}=\partial_zA_x-\partial_xA_z=B_y$$

なので、

$$\boxed{F_{ij}=\epsilon_{ijk}B_k}$$

です。

テンソルが反対称

$$F_{\mu\nu}=-F_{\nu\mu}$$

であるため、16成分のうち独立なのは6成分です。これは $\mathbf E$ の3成分と $\mathbf B$ の3成分にちょうど対応します。

---

## 解答2：行列表現と $F_{13}$

上の規約では、

$$\boxed{
F^{\mu\nu}=\begin{pmatrix}
0&E_x/c&E_y/c&E_z/c\\
-E_x/c&0&B_z&-B_y\\
-E_y/c&-B_z&0&B_x\\
-E_z/c&B_y&-B_x&0
\end{pmatrix}}
$$

です。空間添字を上げ下げしても符号は変わらないので、

$$F_{13}=F^{13}=-B_y$$

です。ポテンシャルから直接計算しても、

$$F_{13}=\partial_xA_z-\partial_zA_x$$

$$=-\left(\partial_zA_x-\partial_xA_z\right)=-B_y$$

となり一致します。

$$\boxed{F_{13}=-B_y}$$

符号を暗記するより、$\mathbf B=\nabla\times\mathbf A$ の該当成分へ戻る方が安全です。

---

## 解答3：四元電流と電荷不変性

$S'$ が $S$ に対して $x$ 方向へ速度 $v$ で動くとき、四元ベクトルの変換より

$$j'^0=\gamma(j^0-\beta j^1)$$

$$j'^1=\gamma(j^1-\beta j^0)$$

です。$j^0=c\rho$、$j^1=j_x$ を代入すると、

$$\boxed{\rho'=\gamma\left(\rho-\frac{vj_x}{c^2}\right)}$$

$$\boxed{j'_x=\gamma(j_x-v\rho)}$$

となります。横成分は

$$j'_y=j_y,qquad j'_z=j_z$$

です。

### 全電荷が不変になる簡単な確認

電荷分布の静止系を $S_0$ とし、その系で密度 $\rho_0$、体積 $V_0$、電流0とします。実験室系からこの分布が $x$ 方向へ速度 $v$ で動いて見えるなら、逆変換から

$$\rho=\gamma\rho_0$$

です。一方、運動方向の長さが収縮するため

$$V=\frac{V_0}{\gamma}$$

です。したがって

$$Q=\rho V=(\gamma\rho_0)\frac{V_0}{\gamma}=\rho_0V_0$$

となり、

$$\boxed{Q=Q_0}$$

です。

密度だけを見ると $\gamma$ 倍に増えますが、同時刻で切り取る体積が $1/\gamma$ になるため全電荷は変わりません。より一般には、時空内の三次元超曲面 $\Sigma$ を通る四元電流の流束

$$Q=\frac{1}{c}\int_\Sigma j^\mu d\Sigma_\mu$$

として書くと、電荷の不変性が座標に依存しない形になります。

---

## 解答4：非斉次Maxwell方程式

### $\mu=0$：Gaussの法則

$$\partial_\nu F^{0\nu}=\mu_0j^0$$

で $F^{00}=0$ だから、

$$\partial_iF^{0i}=\mu_0c\rho$$

です。$F^{0i}=E_i/c$ を用いると、

$$\frac{1}{c}\nabla\cdot\mathbf E=\mu_0c\rho$$

したがって

$$\boxed{\nabla\cdot\mathbf E=\mu_0c^2\rho=\frac{\rho}{\varepsilon_0}}$$

です。最後に $c^2=1/(\mu_0\varepsilon_0)$ を使いました。

### $\mu=i$：Ampère–Maxwellの法則

空間成分では

$$\partial_0F^{i0}+\partial_jF^{ij}=\mu_0j_i$$

です。$F^{i0}=-E_i/c$ と $\partial_0=(1/c)\partial_t$ より、第一項は

$$\partial_0F^{i0}=-\frac{1}{c^2}\frac{\partial E_i}{\partial t}$$

です。第二項は行列から

$$\partial_jF^{ij}=(\nabla\times\mathbf B)_i$$

となります。よって

$$-\frac{1}{c^2}\frac{\partial E_i}{\partial t}+(\nabla\times\mathbf B)_i=\mu_0j_i$$

です。三成分をまとめると、

$$\boxed{\nabla\times\mathbf B=\mu_0\mathbf j+\frac{1}{c^2}\frac{\partial\mathbf E}{\partial t}}$$

を得ます。

時間成分と空間成分を一つの式へまとめられるのは、電荷密度と電流密度が四元電流の成分だからです。

---

## 解答5：斉次Maxwell方程式

$F_{\mu\nu}$ がポテンシャルの反対称微分で定義されると、偏微分の交換可能性から

$$\boxed{\partial_\lambda F_{\mu\nu}+\partial_\mu F_{\nu\lambda}+\partial_\nu F_{\lambda\mu}=0}$$

が恒等的に成り立ちます。これがBianchi恒等式です。

三つの添字をすべて空間成分 $(1,2,3)$ にすると、

$$\partial_xF_{23}+\partial_yF_{31}+\partial_zF_{12}=0$$

$$\partial_xB_x+\partial_yB_y+\partial_zB_z=0$$

なので、

$$\boxed{\nabla\cdot\mathbf B=0}$$

です。

添字に時間を一つ含めると、たとえば $(0,1,2)$ から

$$\partial_0F_{12}+\partial_1F_{20}+\partial_2F_{01}=0$$

が得られます。これは $z$ 成分について

$$\frac{\partial B_z}{\partial t}+(\nabla\times\mathbf E)_z=0$$

を意味します。他の成分も合わせると、

$$\boxed{\nabla\times\mathbf E=-\frac{\partial\mathbf B}{\partial t}}$$

です。

四つのMaxwell方程式は、テンソル記法では次の二行にまとまります。

$$\boxed{\partial_\nu F^{\mu\nu}=\mu_0j^\mu}$$

$$\boxed{\partial_{[\lambda}F_{\mu\nu]}=0}$$

一行目は電荷・電流を源に持つ方程式、二行目はポテンシャルから場を作ったことに伴う幾何学的恒等式です。

---

## 解答6：純粋な電場を別の慣性系から見る

$S'$ が $S$ に対して $x$ 方向へ速度 $v$ で動くとき、平行・垂直成分で書いた場の変換は

$$\mathbf E'_\parallel=\mathbf E_\parallel,qquad \mathbf B'_\parallel=\mathbf B_\parallel$$

$$\mathbf E'_\perp=\gamma(\mathbf E+\mathbf v\times\mathbf B)_\perp$$

$$\mathbf B'_\perp=\gamma\left(\mathbf B-\frac{\mathbf v\times\mathbf E}{c^2}\right)_\perp$$

です。いま

$$\mathbf v=(v,0,0),\qquad \mathbf E=(0,E_0,0),\qquad \mathbf B=\mathbf0$$

なので、

$$\boxed{\mathbf E'=(0,\gamma E_0,0)}$$

$$\boxed{\mathbf B'=\left(0,0,-\gamma\frac{vE_0}{c^2}\right)}$$

です。$S$ で磁場が0でも、$S'$ では磁場が現れます。

### 不変量による検算

電磁場には二つのローレンツ不変量があります。

$$I_1=\mathbf E^2-c^2\mathbf B^2$$

$$I_2=\mathbf E\cdot\mathbf B$$

$S$ では

$$I_1=E_0^2,qquad I_2=0$$

です。$S'$ では

$$\mathbf E'^2-c^2\mathbf B'^2=\gamma^2E_0^2-\gamma^2\frac{v^2}{c^2}E_0^2$$

$$=\gamma^2(1-\beta^2)E_0^2=E_0^2$$

であり、$\mathbf E'\perp\mathbf B'$ なので $I_2=0$ です。よって変換は不変量を保っています。

電場と磁場の個別の値は観測系で変わりますが、二つの不変量が「どの系でも消せない場の性質」を分類します。

---

## 典型的な誤答と、その原因

- **符号規約を書かずに行列を使う**：計量と $F_{\mu\nu}$ の定義が違えば、電場成分の符号も変わります。
- **$F_{13}=B_y$ と機械的に読む**：この規約では $F_{13}=-B_y$ です。回転の成分へ戻って確認します。
- **$\rho$ をローレンツスカラーとする**：$\rho$ は四元電流の時間成分で、$j_x$ と混ざります。不変なのは適切な超曲面上で積分した全電荷です。
- **$\mu=0$ の式で $c$ を一つ落とす**：$j^0=c\rho$ と $F^{0i}=E_i/c$ の両方を明示します。
- **$\partial_jF^{ij}$ の符号を暗記する**：行列の一行を実際に微分し、$\nabla\times\mathbf B$ と照合します。
- **磁場は電場の見かけにすぎないと一般化する**：場の不変量によっては、どの慣性系でも磁場を完全には消せません。

## 学問を深める問い

1. $\mathbf E\cdot\mathbf B=0$ かつ $\mathbf E^2-c^2\mathbf B^2>0$ の場で、磁場が0になる慣性系を求められるか。
2. 作用

   $$S=\int d^4x\left(-\frac{1}{4\mu_0}F_{\mu\nu}F^{\mu\nu}-j_\mu A^\mu\right)$$

   を変分して、非斉次Maxwell方程式を導けるか。
3. ゲージ変換 $A_\mu\to A_\mu+\partial_\mu\chi$ で $F_{\mu\nu}$ が変わらないことを示せるか。

電磁場テンソルを使う目的は、式を短くすることだけではありません。**電場・磁場・電荷・電流が、ローレンツ変換の下でどう一つの構造を作るか**を見える形にすることです。
