---
title: "【化学物理】独自演習：異核Hückel模型・環状共役系・同位体効果"
date: 2026-07-12
draft: false
categories: ["化学物理"]
---

> **この教材について**  
> 本ページは、学部化学物理の標準的な到達目標をもとに独自に作成した演習教材です。大学・担当教員が作成した試験問題の転載ではなく、公式の問題・解答でもありません。問題作成と文章整理には生成AIを補助的に利用し、公開前に内容と計算を確認しています。誤りを見つけた場合はGitHub Issueでお知らせください。詳しくは[制作方針]({{< relref "/policy" >}})をご覧ください。

## この演習の狙い

1. 対称性を使って永年方程式を小さくする。
2. Hückel模型から結合性、非結合性、反結合性を読み取る。
3. Born-Oppenheimer近似と振動同位体効果を結び付ける。

---

## 問題1：対称な三中心異核分子

直線状の三つの原子軌道 $|1\rangle,|2\rangle,|3\rangle$ を考える。両端は同種原子A、中央は異種原子Bとする。重なり積分を無視し、Hückel型ハミルトニアンを

$$\mathbf H=\begin{pmatrix}\alpha&\beta&0\\\beta&\alpha+\delta&\beta\\0&\beta&\alpha\end{pmatrix}$$

とする。$\beta<0$ である。

1. 反対称状態 $|a\rangle=(|1\rangle-|3\rangle)/\sqrt2$ が固有状態であることを示し、固有値を求めよ。
2. 対称状態 $|s\rangle=(|1\rangle+|3\rangle)/\sqrt2$ と中央軌道 $|2\rangle$ の部分空間で、$2\times2$ 行列を作れ。
3. 残り二つのエネルギー固有値を求めよ。
4. $\delta\gg|\beta|$ のとき、各状態の局在性を説明せよ。

### 解答1-1：反対称性による非結合状態

$\mathbf H$ を $|a\rangle$ に作用させると、中央原子への振幅は $\beta/\sqrt2-\beta/\sqrt2=0$ と打ち消し合います。

$$\hat H|a\rangle=\alpha|a\rangle$$

したがって、

$$\boxed{E_a=\alpha}$$

です。この状態は中央原子と混成しないnon-bonding state（非結合状態）です。これは数値計算をする前に対称性から分かります。

### 解答1-2：対称部分空間

基底を $(|s\rangle,|2\rangle)$ とすると、中央との結合は二つの経路が同位相で加わるため $\sqrt2\beta$ になります。

$$\boxed{\mathbf H_{\mathrm sym}=\begin{pmatrix}\alpha&\sqrt2\beta\\\sqrt2\beta&\alpha+\delta\end{pmatrix}}$$

### 解答1-3：固有値

永年方程式は

$$\det(\mathbf H_{\mathrm sym}-E\mathbf I)=(\alpha-E)(\alpha+\delta-E)-2\beta^2=0$$

です。解は

$$\boxed{E_\pm=\alpha+\frac{\delta}{2}\pm\sqrt{\left(\frac{\delta}{2}\right)^2+2\beta^2}}$$

$E_-$ が結合性、$E_+$ が反結合性です。対応する係数は

$$\frac{c_2}{c_s}=\frac{E-\alpha}{\sqrt2\beta}$$

を規格化して求められます。

### 解答1-4：大きな軌道エネルギー差

$\delta\gg|\beta|$ では、Bの軌道エネルギー $\alpha+\delta$ がAよりかなり高い状態です。混成はエネルギー差が大きいほど弱くなるため、

- $E_-$：主に両端Aの対称結合 $|s\rangle$
- $E_+$：主に中央Bの軌道 $|2\rangle$
- $E_a$：両端Aの反対称結合 $|a\rangle$

となります。

> **重要**：軌道が空間的に近いだけでは強く混ざりません。対称性が適合し、かつ軌道エネルギーが近いことが必要です。

---

## 問題2：六員環のHückelエネルギー

同一原子6個が環状につながった平面共役系を考える。各原子に一つの $p_z$ 軌道があり、Coulomb積分を $\alpha$、隣接原子間のresonance integralを $\beta<0$、それ以外の相互作用と重なりを0とする。$\pi$ 電子は6個である。

1. 周期境界条件からエネルギーが $E_m=\alpha+2\beta\cos(2\pi m/6)$ となることを示せ。
2. 全エネルギー準位と縮退度を求めよ。
3. 基底状態の全 $\pi$ 電子エネルギーを求めよ。
4. HOMO-LUMO gapと、孤立した三つの二重結合に対する安定化エネルギーを求めよ。

### 解答2-1：環上のBloch型波動関数

原子番号を $j=0,1,\ldots,5$ とし、係数を

$$c_j=\frac{1}{\sqrt6}e^{ikj}$$

と置きます。環を一周して同じ波動関数に戻る条件 $e^{i6k}=1$ より、$k=2\pi m/6$ です。Hückel方程式

$$\beta c_{j-1}+\alpha c_j+\beta c_{j+1}=Ec_j$$

へ代入すると、

$$E=\alpha+\beta(e^{ik}+e^{-ik})=\alpha+2\beta\cos k$$

したがって、

$$\boxed{E_m=\alpha+2\beta\cos\frac{2\pi m}{6}}$$

### 解答2-2：準位

$$\boxed{\alpha+2\beta\ (1重),\quad \alpha+\beta\ (2重),\quad \alpha-\beta\ (2重),\quad \alpha-2\beta\ (1重)}$$

$\beta<0$ なので、この順に低いエネルギーから並びます。

### 解答2-3：電子配置と全エネルギー

最低準位に2電子、次の二重縮退準位に4電子が入ります。

$$E_\pi=2(\alpha+2\beta)+4(\alpha+\beta)$$

したがって、

$$\boxed{E_\pi=6\alpha+8\beta}$$

全電子が対を作って占有するため、基底状態は閉殻です。

### 解答2-4：gapと非局在化安定化

HOMOは $\alpha+\beta$、LUMOは $\alpha-\beta$ なので、

$$\boxed{\Delta E_{\mathrm{H-L}}=(\alpha-\beta)-(\alpha+\beta)=-2\beta=2|\beta|}$$

孤立した二重結合1個の $\pi$ 電子エネルギーは $2\alpha+2\beta$ です。三つなら $6\alpha+6\beta$ です。したがって、環状非局在化による差は

$$\Delta E_{\mathrm{deloc}}=(6\alpha+8\beta)-(6\alpha+6\beta)=2\beta$$

$\beta<0$ なのでエネルギーは $2|\beta|$ 低下します。

$$\boxed{\text{安定化の大きさ}=2|\beta|}$$

> **よくある誤り**：$\beta$ を正の量として扱うこと。Hückel法では通常 $\beta<0$ なので、「$2\beta$ の変化」はエネルギー低下です。

---

## 問題3：HClとDClの振動同位体効果

HClとDClを同じばね定数 $k$ を持つ調和振動子として扱う。原子質量を $m_{\mathrm H}=1.0u$、$m_{\mathrm D}=2.0u$、$m_{\mathrm{Cl}}=35.5u$ とする。

1. 二原子分子の換算質量 $\mu$ と振動角振動数 $\omega$ を導け。
2. $\omega_{\mathrm{DCl}}/\omega_{\mathrm{HCl}}$ を求めよ。
3. HClの振動波数が $2886\ \mathrm{cm^{-1}}$ のとき、DClの振動波数を予測せよ。
4. 零点エネルギーの差を式で表し、Born-Oppenheimer近似との関係を説明せよ。

### 解答3-1：重心運動と相対運動

二粒子の座標を $x_1,x_2$ とし、相対座標を $q=x_1-x_2$ とします。運動エネルギーを重心座標と相対座標に分けると、相対運動の質量は

$$\boxed{\mu=\frac{m_1m_2}{m_1+m_2}}$$

になります。相対運動方程式は

$$\mu\ddot q=-kq$$

なので、

$$\boxed{\omega=\sqrt{\frac{k}{\mu}}}$$

です。

### 解答3-2：周波数比

$$\mu_{\mathrm{HCl}}=\frac{1.0\times35.5}{1.0+35.5}u\simeq0.9726u$$

$$\mu_{\mathrm{DCl}}=\frac{2.0\times35.5}{2.0+35.5}u\simeq1.8933u$$

同じ $k$ なら、

$$\boxed{\frac{\omega_{\mathrm{DCl}}}{\omega_{\mathrm{HCl}}}=\sqrt{\frac{\mu_{\mathrm{HCl}}}{\mu_{\mathrm{DCl}}}}\simeq0.717}$$

重い同位体を含むDClの方がゆっくり振動します。

### 解答3-3：振動波数

振動波数 $\tilde\nu$ も $\omega$ に比例するため、

$$\boxed{\tilde\nu_{\mathrm{DCl}}\simeq0.717\times2886\ \mathrm{cm^{-1}}\simeq2.07\times10^3\ \mathrm{cm^{-1}}}$$

### 解答3-4：零点エネルギーとBorn-Oppenheimer近似

調和振動子の零点エネルギーは $E_{\mathrm{ZPE}}=\hbar\omega/2=hc\tilde\nu/2$ です。したがって、

$$\boxed{E_{\mathrm{ZPE}}(\mathrm{HCl})-E_{\mathrm{ZPE}}(\mathrm{DCl})=\frac{hc}{2}\left(\tilde\nu_{\mathrm{HCl}}-\tilde\nu_{\mathrm{DCl}}\right)>0}$$

Born-Oppenheimer近似では、同位体置換によって核電荷は変わらないため、電子が作るポテンシャルエネルギー曲線はほぼ同じと考えます。一方、核の質量は変わるので、その同じ曲線上での振動準位間隔が変化します。この差が振動スペクトルの同位体シフトです。

> **院試接続**：実在分子では非調和性があり、倍音や解離限界を記述するにはMorseポテンシャルなどへ拡張します。それでも同位体置換による主要な周波数変化は換算質量から理解できます。

---

## 用語ミニ辞典

| English | 日本語 | 意味 |
|---|---|---|
| secular equation | 永年方程式 | 固有エネルギーを決める行列式方程式 |
| non-bonding orbital | 非結合性軌道 | 結合を強めも弱めもしない軌道 |
| delocalization | 非局在化 | 電子が特定の結合に限定されず広がること |
| reduced mass | 換算質量 | 二体相対運動を一体問題へ変換したときの有効質量 |
| isotope shift | 同位体シフト | 同位体置換によりスペクトル線が移動すること |

## 学習チェック

- 対称・反対称結合を使って行列をブロック対角化できるか。
- $\beta<0$ を保ったまま準位順序と安定化を判断できるか。
- 同位体置換で「電子状態はほぼ同じ、核運動は変わる」と説明できるか。
