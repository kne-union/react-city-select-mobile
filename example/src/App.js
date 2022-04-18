import CitySelect from '@kne/react-city-select-mobile';

const App = () => {
    return <CitySelect size={10} visible onChange={(values) => {
        console.log('值', values)
    }} />;
};

export default App;