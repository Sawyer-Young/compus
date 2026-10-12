import sys,json,re,hashlib,pathlib
import xlrd
root=pathlib.Path(__file__).resolve().parents[1]
source=pathlib.Path(sys.argv[1])
s=xlrd.open_workbook(str(source)).sheet_by_index(0)
province=''; schools=[]
for i in range(s.nrows):
    row=s.row_values(i)
    if row[1]=='' and re.search(r'[（(]\d+所',str(row[0])):
        province=re.split(r'[（(]',str(row[0]))[0].strip()
    if row[5]=='本科':
        schools.append(dict(id=str(int(row[2])),name=row[1].strip(),province=province,city=row[4].strip(),authority=row[3].strip(),note=row[6].strip()))
assert len(schools)==1412,len(schools)
assert len({s['id'] for s in schools})==1412
assert len({s['province'] for s in schools})==31
assert all(s['province'] and s['city'] for s in schools)
out=root/'data';out.mkdir(exist_ok=True)
(out/'schools.json').write_text(json.dumps(schools,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(out/'schools-source.json').write_text(json.dumps(dict(date='2026-06-17',count=1412,provinces=31,scope='中国内地普通本科高校，含职业本科；不含港澳台、专科和成人高校',source='https://dxs.moe.gov.cn/zx/a/sy_xzsd/260618/2045120.shtml',attachment='https://www.moe.gov.cn/jyb_xxgk/s5743/s5744/202606/W020260618416094865984.xls',sha256=hashlib.sha256(source.read_bytes()).hexdigest(),classification='省份使用名单中的分组，城市使用名单中的所在地；不是校区所在地。'),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'count':len(schools),'provinces':sorted({s['province'] for s in schools})},ensure_ascii=True))
