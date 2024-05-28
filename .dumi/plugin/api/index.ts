import { IApi } from 'dumi';
import { ATOMS_META_PATH } from 'dumi/dist/features/meta';
import atomParser from './parse';

function asyncParser() {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('start parse api...');
      const data = atomParser('.dumi/resolveEntry/index.ts', {});
      resolve(data);
      console.log('parse api completed');
    });
  });
}

export default (api: IApi) => {
  let prevData;

  const writeAtomsMetaFile = (data) => {
    api.writeTmpFile({
      noPluginDir: true,
      path: ATOMS_META_PATH,
      content: `export const components = ${JSON.stringify(data, null, 2)};`
    });
  };

  api.describe({
    key: 'oldApiParser',
    enableBy: api.EnableBy.config,
    config: {
      schema: (Joi) => Joi.boolean()
    }
  });
  api.onDevCompileDone(async ({ isFirstCompile }) => {
    if (isFirstCompile) {
      const data = await asyncParser();
      prevData = data;
      writeAtomsMetaFile(prevData);
    }
  });
  api.onGenerateFiles(async () => {
    if (api.env === 'production') {
      writeAtomsMetaFile(await asyncParser());
    } else if (prevData) {
      writeAtomsMetaFile(prevData);
    }
  });
  api.modifyTheme((memo) => {
    const parserOffKey = 'api.component.unavailable';
    const parserOnKey = 'api.component.loading';
    Object.keys(memo.locales).forEach((locale) => {
      if (memo.locales[locale][parserOnKey]) {
        memo.locales[locale][parserOffKey] = memo.locales[locale][parserOnKey];
      }
    });
    return memo;
  });
};
