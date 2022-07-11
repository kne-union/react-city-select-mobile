import React, {useState, useEffect, useRef, useMemo} from 'react';
import {
    Popup,
    Tabs,
    Result,
    DotLoading,
    SideBar,
    Space,
    Tag,
    Empty,
    Divider,
    Selector,
    Button,
    Toast,
    Grid,
    SearchBar,
    List
} from 'antd-mobile';
import {apis as _apis} from './preset';
import {CloseOutline, LeftOutline} from 'antd-mobile-icons';
import './index.scss';

export const RemoteData = ({loader, options, onLoad, children}) => {
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const onLoadRef = useRef(onLoad);
    onLoadRef.current = onLoad;
    useEffect(() => {
        Promise.resolve(loader(options)).then((data) => {
            onLoadRef.current && onLoadRef.current(data);
            setData(data);
        }).catch((e) => {
            console.error(e);
            setError(e);
        });
    }, [loader, options]);
    if (error) {
        return <Result status="error" title="获取数据发生错误" subTitle={error.message}/>
    }
    if (!data) {
        return <DotLoading/>
    }
    return children(data)
};

const SearchInput = ({onChange}) => {
    const [value, setValue] = useState(null);
    const [data, setData] = useState([]);
    const [visible, setVisible] = useState(false);
    return <div>
        <SearchBar className="adm-search-bar-readonly" readonly placeholder='搜索城市' onFocus={() => {
            setVisible(true);
        }}/>
        {visible && <div className="adm-action-search-wrapper">
            <div className="adm-action-search-body">
                <div className="adm-action-search-action">
                    <div className="adm-action-search-back" onClick={() => {
                        setValue(null);
                        setData([]);
                        setVisible(false);
                    }}>
                        <LeftOutline/>
                    </div>
                    <div style={{flex: '1'}}>
                        <SearchBar placeholder='搜索城市' onChange={val => {
                            setValue(val);
                            apis.debounce((() => {
                                apis.searchCities(val).then((list) => {
                                    setData(list);
                                });
                            })(), 500);
                        }}/>
                    </div>
                    <div className="action-button-primary" onClick={() => {
                        apis.searchCities(value).then((list) => {
                            setData(list);
                        });
                    }}>
                        搜索
                    </div>
                </div>
                {data && data.length > 0 && <List>
                    {data.map((item, index) => (
                        <List.Item clickable={false} key={item.value} onClick={(e) => {
                            onChange && onChange(item.value);
                            setValue(null);
                            setData([]);
                            setVisible(false);
                        }}>{item.label}</List.Item>
                    ))}
                </List>}
            </div>
        </div>}
    </div>
};

export const apis = _apis;

export const DisplayCity = ({id, children}) => {
    return <RemoteData loader={apis.getCity} options={id}>{children}</RemoteData>
};

const DisplayCityCount = ({id, name, cities, activeKey}) => {
    return <Space>
        <span>{name}</span>
        <RemoteData loader={apis.getList} options={id}>{(data) => {
            const activeLength = (data || []).filter(x => cities.indexOf(x.code) > -1).length;
            return activeLength > 0 ? <span>({activeLength})</span> : '';
        }}</RemoteData>
    </Space>
}

export {default as preset} from './preset';

const tabList = [{key: 'china', tab: '国内', loader: apis.getChinaCities}, {
    key: 'foreign', tab: '海外', loader: apis.getCountries
}];

const CitySelect = ({title, size, showSelectRender, defaultValue, onChange, onClose, ...props}) => {
    const selectDomRef = useRef();
    const [cityHeight, setCityHeight] = useState(0);
    const [cities, setCities] = useState(defaultValue);
    const [activeKey, setActiveKey] = useState(null);
    const [currentTab, setCurrentTab] = useState('china');
    const appendCity = (code) => {
        if (size === 1) {
            setCities([code]);
            onChange([code]);
            return;
        }
        if (cities.length >= size) {
            Toast.show({
                icon: 'fail',
                content: `最多选择${size}个`,
            });
            return;
        }
        return apis.combineCities(code, cities).then((list) => {
            setCities(list);
            size === 1 && onChange(list);
        })
    };
    const removeCity = (code) => {
        setCities((list) => {
            const newList = list.slice(0);
            const index = list.indexOf(code);
            newList.splice(index, 1);
            return newList;
        });
    };
    const currentItem = useMemo(() => {
        return tabList.find(x => x.key === currentTab);
    }, [currentTab]);
    useEffect(() => {
        if (showSelectRender) {
            setTimeout(() => {
                const dom = selectDomRef.current;
                const _height = dom ? dom.clientHeight : 0;
                setCityHeight(_height);
            }, 200);
        }
    }, [cities, showSelectRender])
    return <Popup bodyStyle={{height: '100%'}} {...props}>
        <div className="adm-popup-header-wrapper">
            <span className="adm-popup-header-close" onClick={(event) => {
                onClose && onClose();
            }}>
                取消
            </span>
            <div className="adm-popup-header">
                <SearchInput onChange={(value) => {
                    appendCity(value);
                }}/>
            </div>
            <span className="adm-popup-header-sure" onClick={(event) => {
                onClose && onClose();
                onChange(cities);
            }}>
                确认
            </span>
        </div>
        {showSelectRender && <div className="adm-popup-selects" ref={selectDomRef}>
            <div offset={1} style={{
                whiteSpace: 'nowrap'
            }}>已选{size > 1 ? <>（{cities.length}/{size}）</> : null}：
            </div>
            <div flex={1} style={{
                padding: '4px 0'
            }}>
                <Space wrap>
                    {cities.map((id) => {
                        return <DisplayCity key={id} id={id}>{(data) => {
                            return <Tag color='primary'>
                                <Space>
                                    <span>{data.parent ? `${data.parent.name}·${data.city.name}` : data.city.name}</span>
                                    {size > 1 && <span onClick={(event) => {
                                        removeCity(id);
                                    }}>
                                        <CloseOutline/>
                                    </span>}
                                </Space>
                            </Tag>;
                        }}</DisplayCity>
                    })}
                </Space>
            </div>
        </div>}
        <div className="adm-popup-body-tabs">
            <Tabs activeKey={currentTab} onChange={(key) => {
                setCurrentTab(key);
            }}>
                {tabList.map((item) => <Tabs.Tab title={item.tab} key={item.key}> </Tabs.Tab>)}
            </Tabs>
        </div>
        <Grid columns={3} gap={8} className="adm-popup-body-wrapper" style={{height: `calc(100% - 56px - 40px - ${cityHeight}px)`}}>
            <Grid.Item span={1} className="adm-popup-body-left">
                <RemoteData loader={currentItem.loader} onLoad={(data) => {
                    data && data.length && setActiveKey(data[0].id);
                }}>{(data) => {
                    return <SideBar activeKey={activeKey} onChange={(item) => {
                        setActiveKey(item);
                    }}>
                        {data.map((item) => <SideBar.Item key={item.id} title={<DisplayCityCount id={item.id} cities={cities} name={item.name} />}></SideBar.Item>)}
                    </SideBar>;
                }}</RemoteData>
            </Grid.Item>
            <Grid.Item span={2} className="adm-popup-body-right">
                <div style={{flex: 1}}>
                    <Space direction="vertical" style={{width: '100%'}}>
                        {activeKey ? <>
                            <Divider orientation="left">
                                <RemoteData loader={apis.getCity}
                                            options={activeKey}>{(data) => data.city.name}</RemoteData>
                            </Divider>
                            <RemoteData loader={apis.getList} options={activeKey}>{(data) => {
                                return <Space wrap>
                                    {data.map(({code, name}) => {
                                        const _value = cities.indexOf(code) > -1 ? [code] : [];
                                        return <Selector key={code} value={_value}
                                                         options={[{label: name, value: code}]}
                                                         onChange={(value) => {
                                                             const checked = value.length > 0;
                                                             if (checked) {
                                                                 appendCity(code);
                                                             } else {
                                                                 removeCity(code);
                                                             }
                                                         }}></Selector>
                                    })}
                                </Space>;
                            }}</RemoteData></> : <Empty/>}

                    </Space>
                </div>
            </Grid.Item>
        </Grid>
    </Popup>
};

CitySelect.defaultProps = {
    title: "请选择城市", size: 1, showSelectRender: false, defaultValue: [], onChange: () => {
    }
};

export default CitySelect;
