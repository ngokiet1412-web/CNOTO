# Nhập CAD gốc từ máy Windows vào CNOTO (cho Codex/owner)

**Do not execute without owner approval if repo is PUBLIC.** All files must have been reviewed for personal data, copyright and allowed disclosure; if not, switch to private repo or retain access-controlled Drive instead. Do not force-push or rewrite `main`.

## Recommended: Git LFS, branch + pull request

Requirements: Git for Windows, Git LFS and SolidWorks (only for CAD validation). Clone repo on machine with the original archive.

```powershell
git clone https://github.com/ngokiet1412-web/CNOTO.git
cd CNOTO
git lfs install
git switch -c import/cad-reverse-engineering
git lfs track "*.SLDPRT" "*.SLDASM" "*.STEP" "*.step" "*.dwg"
# The original source is the SHA-256-verified archive; DO NOT flatten directories:
New-Item -ItemType Directory -Force cad/native | Out-Null
Expand-Archive -LiteralPath "D:\<DUONG_DAN_THUC_TE>\BTL CNOTO.zip" -DestinationPath ".\cad\native"
# Remove only lock/temp files, not real Parts/Assembly:
Get-ChildItem -Path ".\cad\native" -Recurse -File |
  Where-Object { $_.Name.StartsWith('~$') } | Remove-Item
git add .gitattributes cad/native
git status --short
git commit -m "cad: import original RC car reverse-engineering SolidWorks sources"
git push -u origin import/cad-reverse-engineering
```

Open a **draft PR** to `main`; inspect all changes and repository storage policy before merge. Do not upload the raw 147.9MB ZIP to ordinary Git blobs (over GitHub's 100MB hard limit). Git LFS consumes quota and does not mean every agent automatically has large-file permission; a Drive reference can be retained instead.

## Integrity gate
- `BTL CNOTO.zip`: SHA-256 `de547512f5ae50b937311961f6f5def27bd6d4d8379f6ecedf33f28e37c542bf`.
- `BTL CNOTO(1).zip` duplicate, do not add.
- `BTL.zip` 2026-11-01 older package: keep as historical elsewhere.
- `Tamsansat.SLDPRT`, `Phía trên.SLDPRT`, `part duoi.SLDPRT`: version ambiguity; do not replace same-name parts without owner verification. Two smaller candidates are already in `evidence/cad_candidates/`.
- Preserve the parent folder hierarchy under `cad/native/`; paths matter for SolidWorks references.
- `Assem model.SLDASM` should be opened, rebuilt and exported to STEP AP242. Importing 7 small STEP models side by side is **not** a validated full assembly.

## Other evidence not yet in Git
- `FILE LỎ TẠM.pdf` 26 exploded sheets, 12.46MB, SHA256 `d6cb43cbf2284f588f1c875240f3e902d5a11f8c94f8337e80335c2b3a5f37f4`.
- `FILE AUTOCAD.dwg` 18.24MB, SHA256 `30b8b27103e62793735ff4b330d56a45f47608d2d5a63fc634af55fb19dfcb6a`.
- Full `cnoto.pdf` 62.12MB export / actual source photos [Google Doc](https://docs.google.com/document/d/1am_u-qz0aHC4FkCG0Hg1pSDOEQbMZIKDvrzGIA9GNIY/edit).
- `Phía trên.SLDPRT` separate candidate, SHA256 `08ab5cf300df1de6876f4b6491e8fb2e9c2633cafe091e221ed0aee15e7ec4d7`.

Source index: `sources/SOURCE_INDEX.md`. Issue 6 coordinates remaining sources. Do not claim a file is uploaded until GitHub tree confirms its path and commit.
