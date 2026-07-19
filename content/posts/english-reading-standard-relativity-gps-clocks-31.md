---
title: "GPSと相対性理論"
date: 2026-07-14
draft: false
categories: ["英語"]
---

> **この教材について**
> 「相対論がなければGPSは使えない」という有名な説明を、単なる驚き話で終わらせません。速度と重力による時計差を分け、測位誤差へ変換し、衛星・受信機・座標系を一つの系として読みます。

## 学習目標

- clock rate、signal travel time、position errorを因果の順に結ぶ。
- 特殊相対論と一般相対論の効果の符号を区別する。
- 理論の予言と、実用システムへの実装を同一視しない。

## 問題：A Navigation System Is Also a Network of Clocks

> A satellite-navigation receiver does not see its position directly. Each satellite broadcasts a time-tagged signal together with information about its orbit. By comparing transmission and reception times, the receiver estimates a *pseudorange*: a distance-like quantity that includes both geometric distance and clock error. Signals from several satellites let the receiver solve for three spatial coordinates and the offset of its own imperfect clock.
>
> This method makes timing part of the measuring instrument. Light travels about 300 metres in one microsecond, so a clock-rate error that accumulates for a day cannot be dismissed merely because the number of microseconds looks small. Satellite clocks also do not tick at exactly the same rate as clocks on Earth's surface. Their orbital motion makes them run more slowly relative to an Earth-centred reference, an effect associated with special relativity. Their greater altitude places them in a weaker gravitational potential, making them run faster, an effect described by general relativity.
>
> For the main GPS orbit, the commonly quoted contributions are approximately minus 7 microseconds per day from motion and plus 45 microseconds per day from gravity. The net rate is therefore about plus 38 microseconds per day. If that net offset were allowed to accumulate without compensation, multiplying it by the speed of light gives an error scale of roughly 11 kilometres after one day—not because every user's error would grow in one simple straight line, but because the ranging data would become badly inconsistent.
>
> Engineers do not wait for the error to appear and then subtract a slogan-sized correction. Satellite clock frequencies are offset before operation, navigation messages supply further corrections, and receivers account for orbit geometry, atmospheric delay, Earth rotation, and other effects. Relativity supplies indispensable relations between clocks and coordinates; atomic clocks, control systems, estimation algorithms, and repeated calibration make those relations useful. The deeper lesson is that a theory becomes practical when its assumptions are translated into an error budget.

### 語注

- **time-tagged**：送信時刻の情報が付いた
- **pseudorange**：時計誤差などを含む擬似距離
- **offset**：基準からのずれ
- **accumulate**：時間とともに蓄積する
- **gravitational potential**：重力ポテンシャル
- **compensation**：補償、補正
- **estimation algorithm**：観測から未知量を推定する算法
- **error budget**：誤差源と許容値を配分した表

### 設問

#### 問1：主旨

本文の中心的主張として最も適切なものを選びなさい。

- (A) A receiver measures its location directly with one perfect clock.
- (B) Relativistic clock effects become useful only through a larger measurement and correction system.
- (C) General relativity and special relativity change satellite clocks in the same direction.
- (D) Atmospheric delay is the only important source of navigation error.

#### 問2：測位の未知量

複数衛星の信号から、受信機が三つの空間座標以外に推定する量は何ですか。

#### 問3：符号

衛星の運動と高度は、それぞれ衛星時計の進み方へどの向きの効果を与えますか。

#### 問4：語彙

第1段落の **pseudorange** に最も近い説明を選びなさい。

- (A) a distance estimate that also contains timing error
- (B) the exact mechanical length of a satellite
- (C) a map drawn without any clock information
- (D) a signal that travels faster than light

#### 問5：数量推論

38 microsecondsと光速から、約11 kilometresという誤差スケールを求める計算を示しなさい。

#### 問6：限定表現

第3段落が “not because every user's error would grow in one simple straight line” と限定する理由を説明しなさい。

#### 問7：実装

本文が挙げる補正・誤差要因を三つ選び、それぞれが時計、伝播、幾何のどの層に属するか整理しなさい。

#### 問8：英文解釈

> A theory becomes practical when its assumptions are translated into an error budget.

を自然な日本語に訳し、**translated** が単なる言語翻訳でないことを説明しなさい。

#### 問9：発展記述

“GPS proves Einstein was useful.” という説明の長所と不足を、英語80語程度で論じなさい。

## 解答と詳しい解説

### 本文の設計図

| 段落 | 役割 | 読むべき関係 |
|---|---|---|
| 1 | 擬似距離と未知量 | 時刻差→距離情報 |
| 2 | 二つの相対論効果 | 運動は遅く、高度は速く |
| 3 | 誤差スケール | 微小時間×光速 |
| 4 | 工学的実装 | 理論→補正系 |

### 全文訳

衛星測位の受信機は、自分の位置を直接見ているわけではない。各衛星は、軌道情報とともに送信時刻の付いた信号を送る。受信機は送信時刻と受信時刻を比べ、幾何学的距離と時計誤差の両方を含む距離状の量、すなわち擬似距離を推定する。複数衛星の信号により、受信機は三つの空間座標と、自身の不完全な時計のずれを解くことができる。

この方法では、時刻そのものが測定器の一部になる。光は1マイクロ秒で約300メートル進むため、一日蓄積する時計の進み方の誤差は、マイクロ秒という数字が小さく見えるだけでは無視できない。衛星時計は地表の時計と完全に同じ速さでも進まない。軌道運動は、地球中心の基準に対して時計を遅らせる。これは特殊相対論に関係する効果である。一方、高い高度では重力ポテンシャルが弱く、時計は速く進む。これは一般相対論が記述する効果である。

GPSの主要軌道についてよく引用される寄与は、運動による1日約マイナス7マイクロ秒と、重力による約プラス45マイクロ秒である。したがって正味は約プラス38マイクロ秒となる。このずれを補償せず蓄積させれば、光速を掛けた値は一日後に約11キロメートルの誤差スケールとなる。ただし、すべての利用者の位置誤差が単純な一直線で増えるという意味ではなく、測距データ同士が大きく整合しなくなるという意味である。

技術者は誤差が生じるのを待ち、標語のような一個の補正値を引くのではない。衛星時計の周波数は運用前にずらされ、航法メッセージは追加の補正を送り、受信機は軌道配置、大気遅延、地球自転なども考慮する。相対論は時計と座標を結ぶ不可欠な関係を与え、原子時計、制御系、推定算法、反復校正がその関係を実用にする。理論は、その仮定が誤差配分へ落とし込まれたとき実用になる。

### 問1

**正解：(B)**。本文は相対論を不可欠としつつ、相対論だけで測位が完成するとは述べない。(A)は一衛星・完全時計という誤り、(C)は効果の符号が逆、(D)は誤差源を一つへ縮約している。

### 問2

**受信機時計の基準時刻からのずれ**である。位置が三未知数、時計ずれが一未知数なので、通常は少なくとも四つの独立な衛星信号が必要になる。「四衛星だから四次元空間」という意味ではない。

### 問3

運動による特殊相対論効果は衛星時計を**遅く**し、高度による一般相対論効果は地表時計に対して**速く**する。名称を暗記するより、「速度差」と「重力ポテンシャル差」のどちらを比較しているかを見る。

### 問4

**正解：(A)**。(B)は物体の長さ、(C)は時刻情報を捨て、(D)は相対論にも反する。接頭辞 *pseudo-* は「偽物」より「そのままでは純粋な幾何距離ではない」という働きである。

### 問5

\(38\times10^{-6}\,\mathrm{s}\times3.0\times10^8\,\mathrm{m/s}=1.14\times10^4\,\mathrm{m}\)。したがって約11 kmである。単位を残すと、秒が消えてメートルになることも検算できる。

### 問6

実際の位置誤差は衛星配置、受信機の時計推定、各補正、観測時刻によって変わるからである。11 kmは未補償の時刻差を距離へ換算した**代表的スケール**であり、全利用者の軌跡を予言する値ではない。

### 問7

例として、衛星周波数の事前オフセットは**時計層**、大気遅延は**伝播層**、衛星軌道と地球自転は**幾何・座標層**に属する。層を分けると「相対論補正さえすれば完全」という誤答を避けられる。

### 問8

「理論は、その仮定が誤差配分へ落とし込まれたとき、実用的になる。」ここで *translate A into B* はAをBで使える具体形式へ**変換する**こと。日本語へ訳すことではない。

### 問9

例：*The phrase correctly shows that relativity is not remote from daily technology. Satellite clocks would not remain consistent with ground-based coordinates if relativistic rate differences were ignored. However, the phrase hides the rest of the system: atomic clocks, orbit determination, atmospheric models, receiver algorithms, and calibration. GPS is therefore not a single-theory machine. It is an engineered measurement network in which relativity supplies necessary relations and many other components control the remaining errors.*

### 語彙・文脈・語法点検

- **relative to** は「〜と比較して」。時計単独の絶対的な速さを述べない。
- **approximately** は測位方式や軌道条件を無視した厳密定数化を防ぐ副詞。
- **indispensable** は「それだけで十分」でなく「欠かせない」。necessaryとsufficientを分ける。
- **account for** は「説明する」と「計算へ織り込む」の両方があり、ここでは後者。

### 学問を深める問い

時計の誤差を位置と同時に推定できるのに、なぜ相対論的な進み方をモデルへ明示する必要があるのでしょうか。未知量として吸収できる誤差と、衛星ごと・時刻ごとに構造を持つ誤差の違いから考えてください。

### 参考資料

- [GPS.gov: GPS Space Segment](https://www.gps.gov/systems/gps/space/)
- [European Space Agency Navipedia: Relativistic Clock Correction](https://gssc.esa.int/navipedia/index.php/Relativistic_Clock_Correction)
- [NIST: Time and Frequency Division](https://www.nist.gov/pml/time-and-frequency-division)
