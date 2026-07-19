---
title: "自動運転の安全と倫理"
date: 2026-07-13
draft: false
categories: ["英語"]
---

> **この教材について**
> 自動運転の倫理を「歩行者か乗員か」という一度きりの思考実験へ縮めません。事故が避けられない瞬間より前に、運行範囲、検知、減速、故障時対応、監視、説明責任をどう設計するかを読む独自教材です。

## 学習目標

- dramatic dilemma と ordinary safety decision を区別する。
- 系全体の危険低減を、複数の防護層として読む。
- residual risk が残ることと、責任が消えることを混同しない。

## 問題：The Last Second Begins Much Earlier

> Ethical debates about automated vehicles often begin with a dramatic question. If a crash is unavoidable, should a machine protect its passenger or a pedestrian? The question can expose a conflict between values, but it can also create a misleading picture of engineering. A road vehicle does not normally receive a complete description of the future and then choose between two certain deaths. It receives incomplete sensor data, estimates what may happen, and acts under uncertainty. The ethically important work therefore begins long before the imagined final second.
>
> Designers first define an operational design domain: the roads, speeds, weather, visibility, and other conditions in which a function is intended to operate. Within that domain, the system must detect objects, predict movement, obey traffic rules, and preserve enough distance to brake or steer safely. Outside it, the vehicle should not pretend to possess a capability it lacks. A fallback may involve warning a responsible driver, slowing down, stopping in a safer place, or ending automated operation. The appropriate response depends on the level of automation and on whether a human can realistically take control in time.
>
> No single test can prove safety in every possible street scene. Developers combine simulation, controlled-track testing, public-road evidence, analysis of failures, and reports of near-misses. They should also examine uneven performance across lighting conditions, body types, mobility aids, and road users. An average result can conceal a serious weakness for a smaller group. After deployment, monitoring remains necessary because software, maps, traffic patterns, and the environments in which the system is used can change.
>
> This approach does not make ethics disappear into technical procedure. Someone must decide what level of residual risk is acceptable, who may authorize deployment, what evidence must be disclosed, and how injured people can challenge a decision. The key ethical question is not only whom a vehicle would sacrifice in a fictional instant. It is who defines the system's limits, who receives the benefits, who bears the remaining risk, and who is answerable when the safeguards fail.

### 語注

- unavoidable: 避けられない
- operational design domain: システムの作動を想定する条件範囲
- fallback: 通常運転を継続できない場合の代替動作
- near-miss: 事故には至らなかった危険事例
- conceal: 見えにくくする、隠す
- residual risk: 対策後にも残るリスク
- answerable: 説明し、責任を負う立場にある

### 設問

#### 問1：主旨

本文の中心的主張として最も適切なものを選びなさい。

- (A) Automated vehicles should always protect passengers.
- (B) A final-second dilemma is sufficient for evaluating vehicle ethics.
- (C) Ethical evaluation should examine the full safety system, its limits, evidence, risk distribution, and accountability.
- (D) Technical testing can remove every ethical question.

#### 問2：比喩の修正

なぜ本文は、典型的な「究極の二択」が実際の工学を誤って描く可能性があると述べていますか。

#### 問3：概念

operational design domain を本文に即して説明し、その範囲外で必要な態度を答えなさい。

#### 問4：指示内容

第2段落の **Outside it** の *it* は何を指しますか。

#### 問5：証拠

安全性の評価に複数の検証方法を組み合わせる理由を説明し、本文から四つ挙げなさい。

#### 問6：推論

本文から最も妥当に推測できるものを選びなさい。

- (A) A high average score guarantees equal protection in every condition.
- (B) Monitoring may still be needed after a system is released.
- (C) A driver can always take control immediately when warned.
- (D) Residual risk means that safety work has failed completely.

#### 問7：対比

平均性能と集団別・条件別性能を分ける必要があるのはなぜですか。

#### 問8：英文解釈

> Outside it, the vehicle should not pretend to possess a capability it lacks.

を自然な日本語へ訳しなさい。

#### 問9：発展記述

自動化された交通システムの公開前後に必要な安全監査を、英語80語程度で提案しなさい。

## 解答と詳しい解説

### 本文の設計図

| 段落 | 役割 | 読み分けるもの |
|---|---|---|
| 1 | 劇的な二択の限界を示す | 確定した未来と不確実な予測 |
| 2 | 作動範囲と故障時対応を定義 | 能力の範囲内と範囲外 |
| 3 | 安全証拠を組み合わせる | 平均値と条件別の弱点 |
| 4 | 技術を倫理・制度へ戻す | リスク低減と説明責任 |

### 全文訳

自動運転車についての倫理的議論は、しばしば劇的な問いから始まる。衝突を避けられないなら、機械は乗員と歩行者のどちらを守るべきか。この問いは価値の衝突を明らかにできるが、工学を誤解させる図にもなり得る。道路上の車両は普通、未来の完全な記述を受け取り、確実な二つの死から一つを選ぶのではない。不完全なセンサーデータを受け、起こり得ることを推定し、不確実性のもとで動作する。したがって倫理的に重要な仕事は、想像上の最後の一秒よりはるか前から始まる。

設計者はまず、道路、速度、天候、視界、そのほか機能の作動を想定する条件である運用設計領域を定める。その領域内では、物体を検知し、動きを予測し、交通規則を守り、安全に制動・操舵できる距離を確保しなければならない。領域外では、持たない能力を持つふりをしてはならない。代替動作には、責任を担う運転者への警告、減速、より安全な場所での停止、自動運転の終了があり得る。適切な応答は自動化水準と、人が現実に間に合うよう操作を引き継げるかに左右される。

あらゆる道路場面で安全だと、一つの試験だけで証明することはできない。開発者はシミュレーション、試験路、公道での証拠、故障分析、ヒヤリハット報告を組み合わせる。また照明条件、体格、移動補助具、道路利用者による性能の偏りも調べるべきである。平均結果は小さな集団にとっての重大な弱点を隠し得る。導入後も、ソフトウェア、地図、交通パターン、使用環境が変化し得るため監視が必要である。

この方法は倫理を技術手続きの中へ消すものではない。許容できる残余リスク、導入を承認する者、開示すべき証拠、被害者が判断へ異議を唱える方法を、誰かが決めなければならない。重要な倫理的問いは、架空の一瞬に車両が誰を犠牲にするかだけではない。誰がシステムの限界を定義し、誰が便益を受け、誰が残るリスクを負い、防護策が失敗したとき誰が責任を負うかである。

### 問1：正解 (C)

- (A) 本文は乗員優先という固定規則を示していません。
- (B) 二択は価値衝突を見せても、設計・証拠・制度を表し切れません。
- (C) 四段落の論点をすべて統合しています。
- (D) 第4段落は、技術的処置にも価値判断が残ると明示します。

### 問2：解答例

思考実験は、未来の結果が完全に分かり、選択肢が二つだけであるかのように置きます。実際の車両は不完全な観測から確率的に予測し、事故前の速度、車間距離、運用範囲、故障時動作によって危険そのものを減らします。最後の選択だけを見ると、前段階の設計責任が消えます。

### 問3：解答例

道路種類、速度、天候、視界など、機能が作動するよう設計・検証された条件の集合です。範囲外では能力を過大表示せず、減速、停止、運転交代など検証済みの代替動作へ移る必要があります。

### 問4：解答例

*it* は直前の *operational design domain* を指します。単数の名詞と、inside / outside という空間的対比の両方が根拠です。直前の *function* ではありません。

### 問5：解答例

現実の場面を一つの方法で網羅できず、各方法の弱点が異なるためです。本文にはシミュレーション、試験路、公道データ、故障分析、ヒヤリハット報告があり、そのうち四つを挙げます。件数を増やすだけでなく、互いに異なる失敗を発見できる構成が重要です。

### 問6：正解 (B)

- (A) 平均値が小集団の弱点を隠すと述べます。
- (B) ソフトウェアや環境の変化が導入後監視の理由です。
- (C) 引継ぎ可能性は自動化水準と時間に依存します。
- (D) 残余リスクは対策後にも残る危険で、対策が無意味という意味ではありません。

### 問7：解答例

多数の一般的場面で高得点でも、夜間、特定の体格、車椅子利用者などで見落としが集中する可能性があります。総平均は「誰に、どの条件で誤るか」を保存しないので、分布を分解して監査します。

### 問8：解答例

「その範囲外では、車両は自分にない能力を備えているかのように振る舞ってはならない。」*pretend* は人間の意図を文字どおり車へ帰すのではなく、表示や動作による能力の過大提示を批判する表現です。

### 問9：解答例

> Before release, auditors should define the operating domain, test ordinary and rare conditions, examine subgroup performance, and verify a safe fallback. Evidence should combine simulation, controlled tests, and independent road data. After release, the operator should record failures and near-misses, publish meaningful summaries, and investigate changes in performance. A clear authority must be able to restrict or suspend operation when risk exceeds the approved limit, while affected road users need a practical way to report harm and challenge decisions.

## 語彙・語法点検

| 語句 | 品詞・構文 | 文脈・語法と誤りやすい点 |
|---|---|---|
| unavoidable | 形容詞 | 「避けにくい」でなく、仮定上は回避不能 |
| under uncertainty | 前置詞句 | 情報不足の条件下で、という状況を表す |
| intended to operate | 受動＋不定詞 | 実際に常時動くのでなく設計上の想定 |
| fallback | 名詞 | 単なる失敗でなく、失敗時に移る動作 |
| conceal | 他動詞 | 平均値が弱点を見えにくくする |
| residual | 形容詞 | リスク対策後に残ったもの |
| answerable | 形容詞 | 質問可能であるだけでなく説明責任を負う |

## 発展記述の設計

安全を一つの正答規則ではなく、危険源の発見、発生確率の低減、失敗の検知、被害の緩和、記録と改善という層で捉えます。物理の測定でも平均値だけでなく誤差分布と適用範囲を書くように、自動化でも性能値と運用条件を対にします。

## 学問を深めるための問い

CFDモデルを格子幅、境界条件、レイノルズ数から切り離して「正しい」とは言えません。自動運転の認識器も、作動条件から切り離した単一精度では評価できません。モデルの適用範囲を越えたとき、停止する設計と、人へ返す設計のどちらが本当に安全でしょうか。

## 参考資料

- [NHTSA：Automated Vehicle Safety](https://www.nhtsa.gov/vehicle-safety/automated-vehicles-safety)
- [NHTSA：Automated Driving Systems](https://www.nhtsa.gov/vehicle-manufacturers/automated-driving-systems)
- [NIST：AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
- [NIST AI Resource Center：Manage](https://airc.nist.gov/airmf-resources/playbook/manage/)

## 制作・検証方針

生成AIを補助的に使用し、人が英文、正答、安全工学上の概念、参考資料との対応を確認しています。誤りを見つけた場合はサイトの連絡先からお知らせください。本稿は特定の試験問題の転載・再現ではなく、一般的テーマから独自に設計した非公式教材です。
