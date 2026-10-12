import test from 'node:test';
import assert from 'node:assert/strict';
import {schools,provinces,citiesIn,filterSchools,findSchool} from '../lib/school-directory.mjs';
test('2026 official undergraduate catalog is complete and uniquely identified',()=>{
 assert.equal(schools.length,1412);assert.equal(provinces.length,31);
 assert.equal(new Set(schools.map(s=>s.id)).size,1412);assert.equal(new Set(schools.map(s=>s.name)).size,1412);
 assert.ok(schools.every(s=>s.province&&s.city&&/^\d{10}$/.test(s.id)));
});
test('province classification follows MOE headings rather than school location',()=>{
 const s=findSchool('河北工业大学');assert.equal(s.province,'河北省');assert.equal(s.city,'天津市');
 assert.ok(citiesIn('河北省').includes('天津市'));
 assert.ok(filterSchools({province:'河北省',city:'天津市'}).some(x=>x.name==='河北工业大学'));
});
test('global keywords and combined filters return catalog options only',()=>{
 assert.ok(filterSchools({keyword:'杭州 电子科技'}).some(s=>s.name==='杭州电子科技大学'));
 assert.equal(filterSchools({province:'北京市',keyword:'清华'})[0].name,'清华大学');
 assert.equal(filterSchools({province:'浙江省',keyword:'清华'}).length,0);
 assert.equal(findSchool('自由输入的学校'),undefined);assert.equal(findSchool(' 清华大学 ').name,'清华大学');
 assert.ok(schools.some(s=>s.name.includes('职业大学')));
});
