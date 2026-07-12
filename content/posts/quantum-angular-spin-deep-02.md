---
title: "【量子力学II・詳解】角運動量・スピン・合成を測定から理解する"
date: 2026-07-12
draft: false
categories: ["量子力学"]
---

> **この教材について**  
> 本ページは、運営者が以前に作成し実際に解いた量子力学演習を土台として、問題設定・文章・構成を再設計した独自教材です。大学の試験問題の転載や公式解答ではありません。生成AIは整理と検算の補助に利用していますが、解法の選択、学習上の重点、最終確認は運営者が行っています。誤りを見つけた場合はGitHub Issueでお知らせください。詳しくは[制作方針]({{< relref "/policy" >}})をご覧ください。

## このページの見方

角運動量では、行列計算だけを追うと、何を測定しているのかを見失いやすくなります。このページでは、毎回次の三点を分けます。

1. **状態**：どの基底で、どんな係数を持つか。
2. **演算子**：何を測る装置に対応するか。
3. **確率**：状態を測定基底へ展開した係数の絶対値二乗。

行列を掛けること自体ではなく、「基底を選び直して測定確率を読む」ことが核心です。

---

## 問題1：$j=1$ の角運動量行列と測定

$\hat J^2,\hat J_z$ の同時固有状態を $|1,m\rangle$（$m=1,0,-1$）とし、基底をこの順に並べる。

1. 昇降演算子から $J_x,J_y,J_z$ の行列を構成せよ。
2. 状態

$$|\psi\rangle=\frac{1}{\sqrt6}\begin{pmatrix}1\\\\2\\\\1\end{pmatrix}_z$$

について $J_z$ の測定確率、期待値、分散を求めよ。
3. $J_x$ の固有値 $+\hbar$ を得る確率を求めよ。
4. $\langle J_x\rangle$ を二つの方法で求め、結果を照合せよ。

### 出題意図

$J_z$ 基底で与えられた列ベクトルは、$J_z$ の測定にはそのまま使えます。しかし $J_x$ を測るには、$J_x$ の固有ベクトルへ射影する必要があります。「列ベクトルの成分は常に確率振幅」という言い方は不十分で、**どの観測量の固有基底か**まで指定して初めて意味が決まります。

### 解答1-1：昇降演算子から作る

一般に、

$$\hat J_\pm|j,m\rangle=\hbar\sqrt{j(j+1)-m(m\pm1)}|j,m\pm1\rangle$$

です。$j=1$ では非零な作用は

$$J_+|1,0\rangle=\sqrt2\hbar|1,1\rangle,\qquad J_+|1,-1\rangle=\sqrt2\hbar|1,0\rangle$$

です。したがって、

$$J_+=\sqrt2\hbar\begin{pmatrix}0&1&0\\\\0&0&1\\\\0&0&0\end{pmatrix},\qquad J_-=\sqrt2\hbar\begin{pmatrix}0&0&0\\\\1&0&0\\\\0&1&0\end{pmatrix}$$

です。$J_x=(J_++J_-)/2$、$J_y=(J_+-J_-)/(2i)$ より、

$$\boxed{J_x=\frac{\hbar}{\sqrt2}\begin{pmatrix}0&1&0\\\\1&0&1\\\\0&1&0\end{pmatrix}}$$

$$\boxed{J_y=\frac{\hbar}{\sqrt2}\begin{pmatrix}0&-i&0\\\\i&0&-i\\\\0&i&0\end{pmatrix}}$$

$$\boxed{J_z=\hbar\begin{pmatrix}1&0&0\\\\0&0&0\\\\0&0&-1\end{pmatrix}}$$

となります。

> **検算**：行列はHermitian（エルミート）行列でなければなりません。また $[J_x,J_y]=i\hbar J_z$ と $J_x^2+J_y^2+J_z^2=2\hbar^2I$ を満たします。後者の $2\hbar^2$ は $j(j+1)\hbar^2$ に $j=1$ を入れた値です。

### 解答1-2：$J_z$ 測定

状態は規格化されています。

$$\frac{1^2+2^2+1^2}{6}=1$$

$J_z$ 基底での係数をそのまま読めるため、

$$P(+\hbar)=\frac16,\qquad P(0)=\frac46=\frac23,\qquad P(-\hbar)=\frac16$$

です。期待値は

$$\langle J_z\rangle=\hbar\left(\frac16-\frac16\right)=0$$

です。一方、

$$\langle J_z^2\rangle=\hbar^2\left(\frac16+\frac16\right)=\frac{\hbar^2}{3}$$

なので、

$$\boxed{\Delta J_z=\frac{\hbar}{\sqrt3}}$$

です。平均が0でも測定値が常に0という意味ではありません。$+\hbar$ と $-\hbar$ が対称に現れて平均で打ち消し合っています。

### 解答1-3：$J_x=+\hbar$ の測定確率

$J_x$ の無次元行列 $J_x/\hbar$ に対し、固有値 $+1$ の規格化固有ベクトルは

$$|+1\rangle_x=\frac12\begin{pmatrix}1\\\\\sqrt2\\\\1\end{pmatrix}_z$$

です。射影振幅は

$$\langle +1_x|\psi\rangle=\frac{1}{2\sqrt6}(1+2\sqrt2+1)=\frac{1+\sqrt2}{\sqrt6}$$

なので、

$$\boxed{P_x(+\hbar)=\frac{(1+\sqrt2)^2}{6}=\frac{3+2\sqrt2}{6}}$$

です。

同様に、

$$|0\rangle_x=\frac{1}{\sqrt2}\begin{pmatrix}1\\\\0\\\\-1\end{pmatrix},\qquad |-1\rangle_x=\frac12\begin{pmatrix}1\\\\-\sqrt2\\\\1\end{pmatrix}$$

です。この状態では $P_x(0)=0$ で、

$$P_x(-\hbar)=\frac{3-2\sqrt2}{6}$$

となります。三確率の和は1です。

### 解答1-4：期待値を二方向から確かめる

確率分布からは、

$$\langle J_x\rangle=\hbar[P_x(+\hbar)-P_x(-\hbar)]=\frac{2\sqrt2}{3}\hbar$$

です。

一方、行列を直接作用させると、

$$J_x|\psi\rangle=\frac{\hbar}{\sqrt{12}}\begin{pmatrix}2\\\\2\\\\2\end{pmatrix}$$

なので、

$$\langle\psi|J_x|\psi\rangle=\frac{1}{\sqrt6}(1,2,1)\cdot\frac{\hbar}{\sqrt{12}}(2,2,2)^T=\frac{2\sqrt2}{3}\hbar$$

と一致します。

### 典型的な誤答

- $J_z$ 基底の成分 $1:2:1$ を、そのまま $J_x$ の確率に使う。
- 振幅を二乗せず、係数そのものを確率とする。
- 固有ベクトルを規格化しないまま内積を取る。

これらはすべて「測定とは、対応する演算子の正規直交固有基底へ射影すること」という一点を見失うと起きます。

---

## 問題2：スピン$1/2$の歳差運動

一様磁場 $\mathbf B=B_0\mathbf e_z$ 中のスピン$1/2$粒子を考える。Hamiltonianを

$$H=-\gamma\mathbf S\cdot\mathbf B=-\frac{\hbar\Omega}{2}\sigma_z,qquad \Omega=\gamma B_0$$

とする。初期状態は $S_x$ の固有値 $+\hbar/2$ の状態 $|+x\rangle$ とする。

1. $z$ 基底で時間発展状態を求めよ。
2. $S_x=+\hbar/2$ と測定される確率を求めよ。
3. $\langle S_x\rangle,\langle S_y\rangle,\langle S_z\rangle$ を求めよ。
4. Heisenberg方程式から同じ運動を導け。

### 方針：状態の回転と演算子の回転

Schrödinger表示では状態が時間発展し、Heisenberg表示では演算子が時間発展します。両方を計算することで、表示が違っても観測結果が同じであることを確認します。

### 解答2-1：相対位相の時間発展

$z$ 基底では

$$|+x\rangle=\frac{1}{\sqrt2}(|+z\rangle+|-z\rangle)$$

です。エネルギーは $E_+=-\hbar\Omega/2$、$E_-=+\hbar\Omega/2$ なので、

$$\boxed{|\psi(t)\rangle=\frac{1}{\sqrt2}\left(e^{+i\Omega t/2}|+z\rangle+e^{-i\Omega t/2}|-z\rangle\right)}$$

です。共通位相ではなく、二成分の相対位相 $e^{-i\Omega t}$ が観測量を変えます。

### 解答2-2：再び$x$上向きに見つかる確率

$$\langle+x|\psi(t)\rangle=\frac12\left(e^{i\Omega t/2}+e^{-i\Omega t/2}\right)=\cos\frac{\Omega t}{2}$$

より、

$$\boxed{P_{+x}(t)=\cos^2\frac{\Omega t}{2}}$$

です。スピンの状態ベクトルは位相角 $\Omega t/2$ を含みますが、Blochベクトルと観測確率は角度 $\Omega t$ で回ります。スピノルが $2\pi$ 回転で符号を変え、$4\pi$ で元のベクトルへ戻る性質と関係します。

### 解答2-3：スピン期待値

Pauli行列を使って直接計算すると、

$$\boxed{\langle S_x\rangle=\frac\hbar2\cos\Omega t}$$

$$\boxed{\langle S_y\rangle=-\frac\hbar2\sin\Omega t}$$

$$\boxed{\langle S_z\rangle=0}$$

です。したがって、期待値ベクトルは大きさ $\hbar/2$ を保って $xy$ 平面を回転します。磁場はエネルギーを変えず、向きを歳差運動させます。

符号はHamiltonianと $\gamma$ の定義に依存します。式を暗記するより、$t=0$ で

$$\left.\frac{d\langle S_y\rangle}{dt}\right|_{t=0}=-\frac{\hbar\Omega}{2}$$

となることをHamiltonianから確かめる方が安全です。

### 解答2-4：Heisenberg方程式

$$\frac{dS_x}{dt}=\frac{i}{\hbar}[H,S_x]$$

へ $H=-\Omega S_z$ と $[S_z,S_x]=i\hbar S_y$ を入れると、

$$\frac{dS_x}{dt}=\Omega S_y$$

です。同様に、

$$\frac{dS_y}{dt}=-\Omega S_x,qquad \frac{dS_z}{dt}=0$$

となります。初期条件 $S_x(0)=\hbar/2,S_y(0)=0$ に対する解は上の期待値と一致します。

> **物理像**：量子力学的スピンを「小さな自転する球」と考えるのは正確ではありません。しかし交換関係が作る期待値の運動は、古典的磁気モーメントの歳差運動と同じ形になります。対応は結果の構造にあり、内部機構の同一性を意味しません。

---

## 問題3：二つのスピン$1/2$を合成する

二つのスピン $\mathbf S_1,\mathbf S_2$ に対し、全スピンを $\mathbf S=\mathbf S_1+\mathbf S_2$ とする。

1. 積基底からtriplet（三重項）とsinglet（一重項）を構成せよ。
2. 交換 $1\leftrightarrow2$ に対する対称性を調べよ。
3. $\mathbf S_1\cdot\mathbf S_2$ の固有値を各多重項で求めよ。
4. Heisenberg交換相互作用 $H=J\mathbf S_1\cdot\mathbf S_2$ の準位順序を $J>0,J<0$ で説明せよ。

### 出題意図

Clebsch–Gordan係数を表から読む前に、最高ウェイト状態と下降演算子から自分で構成します。これにより、係数の符号、規格化、交換対称性が一つの流れで見えます。

### 解答3-1：最高状態から降りる

$M=1$ を持つ状態は一つだけなので、

$$|1,1\rangle=|\uparrow\uparrow\rangle$$

です。全下降演算子 $S_-=S_{1-}+S_{2-}$ を作用させると、

$$S_-|1,1\rangle=\hbar\left(|\downarrow\uparrow\rangle+|\uparrow\downarrow\rangle\right)$$

です。一方、一般公式では

$$S_-|1,1\rangle=\sqrt2\hbar|1,0\rangle$$

なので、

$$|1,0\rangle=\frac{1}{\sqrt2}\left(|\uparrow\downarrow\rangle+|\downarrow\uparrow\rangle\right)$$

です。さらに降ろして $|1,-1\rangle=|\downarrow\downarrow\rangle$ を得ます。

$M=0$ の二次元部分空間で $|1,0\rangle$ と直交する規格化状態は、

$$|0,0\rangle=\frac{1}{\sqrt2}\left(|\uparrow\downarrow\rangle-|\downarrow\uparrow\rangle\right)$$

です。まとめると、

$$\boxed{\begin{aligned}|1,1\rangle&=|\uparrow\uparrow\rangle,\\\\|1,0\rangle&=\frac{|\uparrow\downarrow\rangle+|\downarrow\uparrow\rangle}{\sqrt2},\\\\|1,-1\rangle&=|\downarrow\downarrow\rangle,\\\\|0,0\rangle&=\frac{|\uparrow\downarrow\rangle-|\downarrow\uparrow\rangle}{\sqrt2}.\end{aligned}}$$

### 解答3-2：交換対称性

粒子ラベルを交換すると、tripletの三状態は変わらず、singletだけが符号を変えます。

$$P_{12}|1,M\rangle=+|1,M\rangle,qquad P_{12}|0,0\rangle=-|0,0\rangle$$

スピン部分の対称性は、同種粒子の全波動関数を作るときに空間部分の対称性と組み合わされます。電子はFermi粒子なので全体が反対称でなければならず、singletなら空間部分は対称、tripletなら空間部分は反対称になります。

### 解答3-3：内積の固有値

$$S^2=(S_1+S_2)^2=S_1^2+S_2^2+2\mathbf S_1\cdot\mathbf S_2$$

より、

$$\mathbf S_1\cdot\mathbf S_2=\frac12(S^2-S_1^2-S_2^2)$$

です。各スピンは $s_1=s_2=1/2$ なので、$S_1^2=S_2^2=3\hbar^2/4$ です。

tripletでは $S=1$ だから、

$$\boxed{\mathbf S_1\cdot\mathbf S_2=\frac{\hbar^2}{4}\qquad(S=1)}$$

singletでは $S=0$ だから、

$$\boxed{\mathbf S_1\cdot\mathbf S_2=-\frac{3\hbar^2}{4}\qquad(S=0)}$$

です。

> **検算**：平行に近いtripletで内積が正、反平行の量子重ね合わせであるsingletで負になるため、符号は直感とも一致します。ただしsingletは単なる $|\uparrow\downarrow\rangle$ ではなく、二つの積状態のentangled state（もつれた状態）です。

### 解答3-4：交換相互作用

$H=J\mathbf S_1\cdot\mathbf S_2$ なら、

$$E_{mathrm t}=\frac{J\hbar^2}{4},qquad E_{mathrm s}=-\frac{3J\hbar^2}{4}$$

です。準位差は

$$E_{mathrm t}-E_{mathrm s}=J\hbar^2$$

なので、

- $J>0$：singletが低い。反強磁性的結合。
- $J<0$：tripletが低い。強磁性的結合。

となります。角運動量合成は、単なる基底変換ではなく、磁性や原子スペクトルの準位分裂を理解する言葉になります。

---

## 問題を解いた後の統合チェック

### 1. 交換関係・回転・測定は別々ではない

$[J_i,J_j]=i\hbar\epsilon_{ijk}J_k$ は、ある軸の角運動量が別の軸まわりの回転を生成することを表します。そのため、行列表示、時間発展、測定基底の変換は同じ代数から生まれます。

### 2. 期待値だけでは状態を決められない

$\langle J_z\rangle=0$ でも、$m=0$ が確定した状態と、$m=\pm1$ が半々の状態は異なります。少なくとも分散や、可能なら完全な確率分布を見る必要があります。

### 3. 合成は「矢印を足す」だけではない

古典ベクトルの足し算に似た三角条件 $|j_1-j_2|\le J\le j_1+j_2$ を持ちますが、量子論では状態空間の基底変換と交換対称性が加わります。

## 用語ミニ辞典

| English | 日本語 | このページでの意味 |
|---|---|---|
| projection | 射影 | 状態を測定する演算子の固有状態へ重ねる操作 |
| precession | 歳差運動 | スピン期待値が磁場軸のまわりを回る運動 |
| triplet / singlet | 三重項／一重項 | 全スピン1の三状態／全スピン0の一状態 |
| entanglement | 量子もつれ | 各粒子の状態へ分離して書けない相関 |
| exchange interaction | 交換相互作用 | スピンの相対配置に依存する有効相互作用 |

## 学習チェック

- 列ベクトルの成分を確率として読む前に、基底を言えるか。
- $S_x$ 測定確率を $z$ 基底から計算できるか。
- Schrödinger表示とHeisenberg表示で同じ歳差運動を導けるか。
- tripletとsingletを表の暗記なしで構成できるか。
- $\mathbf S_1\cdot\mathbf S_2$ を全スピン $S^2$ で書き換える理由を説明できるか。
