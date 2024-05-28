import * as parser from 'react-docgen-typescript-dumi-tmp';
import { buildFilter as getBuiltinFilter } from 'react-docgen-typescript-dumi-tmp/lib/buildFilter';
import FileCache from './cache';

const propFilter = {
  // 是否忽略从 node_modules 继承的属性，默认值为 false
  skipNodeModules: true,
  // 需要忽略的属性名列表，默认为空数组
  skipPropsWithName: [],
  // 是否忽略没有文档说明的属性，默认值为 false
  skipPropsWithoutDoc: true
};

const cacher = new FileCache();
// ref: https://github.com/styleguidist/react-docgen-typescript/blob/048980a/src/parser.ts#L1110
const DEFAULT_EXPORTS = [
  'default',
  '__function',
  'Stateless',
  'StyledComponentClass',
  'StyledComponent',
  'FunctionComponent',
  'StatelessComponent',
  'ForwardRefExoticComponent'
];

/**
 * implement skipNodeModules filter option
 * @param prop  api prop item, from parser
 * @param opts  filter options
 */
function extraFilter(prop, opts: any) {
  // check within node_modules
  if (opts.skipNodeModules) {
    return prop.declarations.some((d) => !d.fileName.includes('node_modules'));
  }

  return true;
}

export default function parse(filePath: string, { componentName, ...filterOpts }: any = {}) {
  let definitions = cacher.get(filePath);
  let localFilter = filterOpts;
  const globalFilter = propFilter;
  const isDefaultRegExp = new RegExp(`^${componentName}$`, 'i');

  switch (typeof globalFilter) {
    // always use global filter if it is funuction
    case 'function':
      localFilter = globalFilter;
      break;

    // merge passed opts & global opts, and create custom filter
    default:
      localFilter = ((mergedOpts) => (prop, component) => {
        const builtinFilter = getBuiltinFilter({ propFilter: mergedOpts });

        return builtinFilter(prop, component) && extraFilter(prop, mergedOpts);
      })(Object.assign({}, globalFilter, localFilter));
  }

  // use cache first
  if (!definitions) {
    let defaultDefinition: any;

    definitions = {};
    parser
      .withCompilerOptions(
        { esModuleInterop: true, jsx: 'preserve' as any },
        {
          savePropValueAsString: true,
          shouldExtractLiteralValuesFromEnum: true,
          shouldRemoveUndefinedFromOptional: true,
          componentNameResolver: (source) => {
            // use parsed component name from remark pipeline as default export's displayName
            return DEFAULT_EXPORTS.includes(source.getName()) ? componentName : undefined;
          },
          propFilter: localFilter
        }
      )
      .parse(filePath)
      .forEach((item) => {
        // convert result to IApiDefinition
        const exportName = isDefaultRegExp.test(item.displayName) ? 'default' : item.displayName.toLowerCase();
        const props = Object.entries(item.props).map(([identifier, prop]: any) => {
          const result = { identifier } as any;
          const fields = ['identifier', 'description', 'type', 'defaultValue', 'required'];
          const localeDescReg = /(?:^|\n+)@description\s+/;

          fields.forEach((field) => {
            switch (field) {
              case 'type':
                result.type = prop.type.raw || prop.type.name;
                break;

              case 'description':
                // the workaround way for support locale description
                // detect locale description content, such as @description.zh-CN xxx
                if (localeDescReg.test(prop.description)) {
                  // split by @description symbol
                  const groups = prop.description.split(localeDescReg).filter(Boolean);

                  groups?.forEach((str) => {
                    const [, locale, content] = str.match(/^(\.[\w-]+)?\s*([^]*)$/);

                    result[`description${locale || ''}`] = content;
                  });
                } else if (prop.description) {
                  result.description = prop.description;
                }
                break;

              case 'defaultValue':
                if (prop[field]) {
                  result.default = prop[field].value;
                }
                break;

              default:
                if (prop[field]) {
                  result[field] = prop[field];
                }
            }
          });

          return result;
        });

        if (exportName === 'default') {
          defaultDefinition = props;
        } else {
          definitions[exportName] = props;
        }
      });

    // to make sure default export always in the top
    if (defaultDefinition) {
      definitions = Object.assign({ default: defaultDefinition }, definitions);
    }
  }

  cacher.add(filePath, definitions);

  return definitions;
}
