# Organoid Neurobiology Lab

## 1. 내용 바꾸기

| 바꾸고 싶은 것 | 파일 |
|---|---|
| 랩 이름, 소속, 이메일, 주소 | `hugo.toml` |
| 홈 문구 | `content/_index.md` |
| 연구 주제 | `data/research.yml` |
| 논문 목록 | `data/publications.yml` |
| 팀 구성원 | `data/team.yml` |
| Contact 안내문 | `content/contact.md` |

각 파일 맨 위에 사용법 주석이 달려 있습니다.

### 논문 추가

`data/publications.yml` 아무 곳에나 항목을 붙여넣으면 됩니다. **연도순 정렬은 자동입니다.**

```yaml
- title: 논문 제목
  authors: "Kim Soyeon, **Lee Hyunwoo**, Park Jiwon"
  journal: Nature Neuroscience
  year: 2026
  doi: 10.1038/s41593-026-01847-x
```

- 굵게 표시할 이름은 `**별표 두 개**`로 감쌉니다
- `doi`는 숫자 부분만. 없으면 그 줄을 지우세요

### DOI 추가

논문 항목에 `doi:` 가 있으면 목록에 클릭 가능한 링크가 생깁니다.
26편 중 22편은 이미 채워져 있습니다. 나머지 4편은 아래에 한 줄만 추가하면 됩니다.

```yaml
  year: 2019
  doi: 10.1002/elps.201800384    ← 이렇게 year 아래에
```

숫자 부분만 씁니다. `https://doi.org/` 는 자동으로 붙습니다.

### 팀원 추가 — 굵게 표시

학위(**M.S.**, **Ph.D.**, **B.S.**)와 직함(**Senior Researcher** 등)은 논문 저자 표기와 같은 방식으로
`**별표 두 개**`로 감쌉니다. `*별표 하나*`는 이탤릭입니다 (학위논문 제목에 사용).

```yaml
education:
  - "**Ph.D.** in Neuroscience, OO University, 2020–2024"
  - "**B.S.** in Biology, OO University, 2016–2020"
experience:
  - "**Postdoctoral Researcher**, Organoid Neurobiology Lab, 2024–present"
```

**별표가 들어간 줄은 반드시 큰따옴표로 감싸세요.** YAML 규칙입니다. 안 감싸면 빌드가 실패합니다.
`data/team.yml` 맨 위에 복사해 쓸 수 있는 템플릿을 넣어뒀습니다.

### 팀원 추가

`data/team.yml`의 `members:` 아래에 항목을 추가하고, 사진을 `static/images/team/`에 넣습니다.
**`education`이나 `experience`가 없으면 그 항목은 제목까지 자동으로 숨겨집니다.**

사진은 정사각형(예: 800×800)을 권장합니다. jpg, png, webp 모두 됩니다.

### 새 항목을 쓸 때

**빈 줄부터 새로 타이핑하지 말고, 바로 위 항목을 복사해서 값만 바꾸세요.**
YAML은 들여쓰기가 어긋나면 빌드가 실패하는데, 복사하면 이 실수가 거의 안 납니다.

---

## 2. 색과 폰트 바꾸기

`static/css/style.css` 맨 위 `:root` 블록만 고치면 사이트 전체에 반영됩니다.

```css
--accent:   #1b3a6b;   /* 네이비 — 링크, 라벨, 사진 그림자 */
--accent-2: #c07f1e;   /* 앰버 — Research 번호, 키워드, CV 라벨 */
```

로고 크기는 `.wordmark-logo`의 `height`, 랩 이름 크기는 `.wordmark-text`의 `font-size`로
조절합니다. 현재는 34px / 21px입니다.

### 폰트

지금은 **CDN에서 불러옵니다.** 저장소에는 폰트 파일이 없고 `head.html`의 링크 세 줄이 전부입니다.

| 용도 | 폰트 | 출처 | 라이선스 |
|---|---|---|---|
| 제목·랩 이름 | Newsreader | Google Fonts | OFL |
| 본문 (영문) | Inter | Google Fonts | OFL |
| 라벨·연도·DOI | IBM Plex Mono | Google Fonts | OFL |
| 한글 | Pretendard Variable | jsDelivr CDN | OFL |

넷 다 상업 이용과 웹폰트 사용이 자유롭습니다.

한글은 `unicode-range` 방식의 dynamic subset이라, **한글이 없는 페이지에서는 아예 다운로드되지 않습니다.**

자체 호스팅으로 바꾸는 방법은 아래 "나중에 할 것"을 참고하세요.

### 히어로 배경 도형

`static/images/hero/organoid.svg` 파일 하나입니다. JavaScript 를 쓰지 않는 정적 SVG 이고,
`tools/make_organoid_svg.py` 로 생성했습니다.

```bash
python3 tools/make_organoid_svg.py static/images/hero/organoid.svg 77
```

마지막 숫자가 seed 입니다. 바꾸면 완전히 다른 배치가 나오니, 마음에 드는 것이
나올 때까지 돌려보시면 됩니다 (현재는 77).

- 진하기: 스크립트 상단의 `GAIN` (현재 2.4)
- 색: 그 아래 `C` 딕셔너리
- 위치와 크기: `static/css/style.css` 의 `.page-motif` 에서 `right` / `bottom` / `width`

도형은 히어로가 아니라 `main` 을 기준으로 배치되어 하단이 푸터 경계선에 맞습니다.
Home 은 내용이 짧아 아래쪽에 여백이 남는데, 그 자리를 도형이 채웁니다.

화면 폭에 따라 크기와 위치가 자동으로 조정됩니다. 좁은 화면에서는 글 아래로 내려갑니다.

### 헤더 배경 애니메이션

`static/js/header-fx.js` 파일 하나로 동작합니다. 외부 라이브러리를 쓰지 않습니다.

```css
--fx-1:     #c3aef5;   /* 방울 밝은 쪽 */
--fx-2:     #6f55cc;   /* 방울 짙은 쪽 */
--fx-alpha: 0.42;      /* 진하기 — 0 에 가까울수록 옅어집니다 */
```

끄고 싶으면 `layouts/baseof.html`에서 `header-fx.js` 를 불러오는 줄을 지우면 됩니다.
방울 개수와 크기는 화면 폭에 따라 자동으로 조정됩니다 (`header-fx.js` 의 `resize` 함수).

---

## 3. 내 PC에서 확인하기

**Hugo 설치** (한 번만)

- Windows: `winget install Hugo.Hugo.Extended`
- macOS: `brew install hugo`

**미리보기 실행**

```bash
hugo server
```

브라우저에서 `localhost:1313`을 열면 됩니다. 파일을 저장하는 순간 화면이 자동으로 갱신됩니다.
중단하려면 터미널에서 Ctrl+C.

> Hugo **0.146 이상**이 필요합니다. 이 프로젝트는 새 레이아웃 구조(`layouts/` 평탄화 + `_partials`)를 씁니다.
> 인터넷에서 찾은 튜토리얼에 `layouts/_default/`가 나오면 구버전 자료입니다.

---

## 폴더 구조

```
hugo.toml                  사이트 설정, 메뉴
content/                   글 (마크다운)
data/                      데이터 (YAML) ← 평소 여기만 고칩니다
layouts/                   HTML 틀
  baseof.html                모든 페이지를 감싸는 뼈대
  home.html / research.html / publications.html / team.html / page.html
  _partials/                 헤더, 푸터, 인물 블록
static/                    CSS, 사진 (그대로 복사됨)
.github/workflows/         자동 빌드 설정 (건드릴 일 없음)
preview/                   미리보기용 빌드 결과 (편집 금지)
```
