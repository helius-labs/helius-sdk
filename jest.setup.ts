import mockAxios from "jest-mock-axios";

afterEach(() => {
    mockAxios.reset();
});