import { AutoComplete, Checkbox, message } from 'antd';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { core } from '../../util';
import './index.less';

export const initBMapSource = (ak, fn = () => {}) => {
  if ((window as any).BMap) {
    fn();
    return;
  }
  (window as any).BMapInitialize = fn;
  var script = document.createElement('script');
  script.src = `https://api.map.baidu.com/api?v=3.0&ak=${ak}&callback=BMapInitialize`;
  document.body.appendChild(script);
};

// type
// 1：GPS标准坐标；
// 2：搜狗地图坐标；
// 3：火星坐标（gcj02），即高德地图、腾讯地图和MapABC等地图使用的坐标；
// 4：3中列举的地图坐标对应的墨卡托平面坐标;
// 5：百度地图采用的经纬度坐标（bd09ll）；
// 6：百度地图采用的墨卡托平面坐标（bd09mc）;
// 7：图吧地图坐标；
// 8：51地图坐标；
interface IProps {
  position?: {
    point?: {
      lat: number;
      lng: number;
      type?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
    };
  };
}
export const BMap = forwardRef((props: IProps, ref) => {
  const BMapGLRef = useRef((window as any).BMap);
  const BMapGL = BMapGLRef.current;
  const geocRef = useRef(BMapGL ? new BMapGL.Geocoder() : {});
  const geoc = geocRef.current;
  const ConvertorRef = useRef(BMapGL ? new BMapGL.Convertor() : {});
  const convertor = ConvertorRef.current;
  const mapIdRef = useRef(core.uniqueId());
  const searchIdRef = useRef(core.uniqueId());
  const mapRef = useRef<any>(null);
  const searchRef = useRef<any>(null);
  const locationRef = useRef<any>(null);
  const { position } = props;
  const [searchValue, setSearchValue] = useState('');
  const [choosePointStatus, setChoosePointStatus] = useState(false);
  const [options, setOptions] = useState<any[]>([]);
  const handleSearch = (v) => {
    searchRef.current.search(v);
    setSearchValue(v);
  };
  const setPoint = (map, point) => {
    map.clearOverlays();
    map.addOverlay(new BMapGL.Marker(point)); //添加标注
  };
  useImperativeHandle(
    ref,
    () => ({
      getValue: () => locationRef.current
    }),
    []
  );
  useEffect(() => {
    const map = (mapRef.current = new BMapGL.Map(mapIdRef.current));
    map.enableScrollWheelZoom(true);
    const search = new BMapGL.Autocomplete({
      input: searchIdRef.current,
      location: map,
      onSearchComplete: (res) => {
        search.hide();
        setOptions(
          res.Wr.map((item) => ({
            label: (
              <div>
                <span>{item.business}</span>
                <span> </span>
                <span style={{ color: '#C0C0C0', fontSize: 12 }}>
                  {item.city === item.district ? item.city : item.city + item.district}
                </span>
              </div>
            ),
            value: item.business
          }))
        );
      }
    });
    searchRef.current = new BMapGL.LocalSearch(map, {
      //智能搜索
      onSearchComplete: function () {
        const position = searchRef.current.getResults().getPoi(0);
        map.centerAndZoom(position.point, 16);
        setPoint(map, position.point);
        geoc.getLocation(position.point, function (rs) {
          locationRef.current = rs;
        });
      }
    });
  }, []);
  useEffect(() => {
    const map = mapRef.current;
    const onClick = (e) => {
      const { point } = e;
      setPoint(map, new BMapGL.Point(point.lng, point.lat));
      geoc.getLocation(point, function (rs) {
        locationRef.current = rs;
        setSearchValue(rs?.content?.poi_desc || rs?.address);
      });
    };
    choosePointStatus && map.addEventListener('click', onClick);
    return () => {
      map.removeEventListener('click', onClick);
    };
  }, [choosePointStatus]);
  useEffect(() => {
    const map = mapRef.current;
    if (!position) {
      map.centerAndZoom('北京', 16);
      return;
    }
    const { point } = position;
    if (!point) {
      map.centerAndZoom('北京', 16);
      return;
    }
    const { lng, lat, type } = point;
    if (!lng || !lat) {
      map.centerAndZoom('北京', 16);
      return;
    }
    const mapPoint = new BMapGL.Point(lng, lat);
    if (type) {
      convertor.translate([mapPoint], type, 5, (data) => {
        if (data.status === 0) {
          const [point] = data.points;
          map.centerAndZoom(point, 16);
          setPoint(map, point);
          geoc.getLocation(point, function (rs) {
            locationRef.current = rs;
            setSearchValue(rs?.content?.poi_desc || rs?.address);
          });
        } else {
          message.error('坐标转换失败');
        }
      });
    } else {
      map.centerAndZoom(mapPoint, 16);
      setPoint(map, mapPoint);
      geoc.getLocation(mapPoint, function (rs) {
        locationRef.current = rs;
        setSearchValue(rs?.content?.poi_desc || rs?.address);
      });
    }
  }, [position]);
  return (
    <>
      <div id={mapIdRef.current} className="zh_map_container" />
      <div className="zh_map_info">
        <input type="text" id={searchIdRef.current} style={{ display: 'none' }} value={searchValue} />
        <AutoComplete
          value={searchValue}
          disabled={choosePointStatus}
          onSearch={setSearchValue}
          onSelect={handleSearch}
          options={options}
          style={{ flex: 1, marginRight: 10 }}
        />
        <Checkbox checked={choosePointStatus} onChange={(e) => setChoosePointStatus(e.target.checked)}>
          地图选点
        </Checkbox>
      </div>
    </>
  );
});
