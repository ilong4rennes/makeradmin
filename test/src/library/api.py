import requests

from library.base import TestCaseBase
from library.test_config import API_BEARER
from library.util import merge_paths, get_path


class ApiResponse:
    
    def __init__(self, response):
        self.response = response
        
    def expect(self, code=None, **kwargs):
        if code is not None:
            assert code == self.response.status_code, (
                f"bad status, expected code '{code}', was '{self.response.status_code}'"
                f", url: {self.response.url}, content: {self.response.text}"
            )
            
        data = self.response.json()
        for path, expected_value in merge_paths(**kwargs).items():
            value = get_path(data, path)
            assert expected_value == value, (
                f"bad value at path '{path}', expected '{expected_value}', was '{value}'"
                f", url: {self.response.url}, content: {self.response.text}"
            )
        
        return self
    
    @property
    def data(self):
        return self.get('data')
    
    def get(self, *paths):
        data = self.response.json()
        result = [get_path(data, path) for path in paths]
        if len(result) == 1:
            return result[0]
        return result
    
    def print(self):
        print(self.response.text)
        return self
    

class ApiFactory:
    
    def __init__(self, obj_factory=None, base_url=None):
        self.obj = obj_factory
        self.base_url = base_url
        self.api_token = API_BEARER
        
        self.member = None
        self.group = None
        self.category = None
        self.product = None
        self.action = None
    
    def request(self, method, path, **kwargs):
        token = kwargs.pop('token', self.api_token)
        headers = kwargs.pop('headers', {"Authorization": "Bearer " + token})
        url = self.base_url + "/" + path
        return ApiResponse(requests.request(method, url=url, headers=headers, **kwargs))

    def post(self, path, json=None, **kwargs):
        return self.request("post", path, json=json, **kwargs)

    def put(self, path, json=None, **kwargs):
        return self.request("put", path, json=json, **kwargs)

    def delete(self, path, json=None, **kwargs):
        return self.request("delete", path, json=json, **kwargs)
        
    def get(self, path, params=None, **kwargs):
        return self.request("get", path, params=params, **kwargs)

    def create_member(self, **kwargs):
        obj = self.obj.create_member(**kwargs)
        self.member = self.post("membership/member", json=obj).expect(code=201, status='created').data
        return self.member

    def create_group(self, **kwargs):
        obj = self.obj.create_group(**kwargs)
        self.group = self.post("membership/group", json=obj).expect(code=201, status='created').data
        return self.group

    def create_category(self, **kwargs):
        obj = self.obj.create_category(**kwargs)
        self.category = self.post("webshop/category", json=obj).expect(code=200, status='created').data
        return self.category
        
    def delete_category(self, id=None):
        return self.delete(f"webshop/category/{id or self.category['id']}").expect(code=200, status='deleted').data

    def create_product(self, **kwargs):
        if self.category:
            kwargs.setdefault('category_id', self.category['id'])
            
        obj = self.obj.create_product(**kwargs)
        self.product = self.post("webshop/product", json=obj).expect(code=200, status='created').data
        return self.product
    
    def delete_product(self, id=None):
        return self.delete(f"webshop/product/{id or self.product['id']}").expect(code=200, status='deleted').data
        
    def create_product_action(self, **kwargs):
        if self.product:
            kwargs.setdefault('product_id', self.product['id'])
        
        obj = self.obj.create_product_action(**kwargs)
        self.action = self.post(f"/webshop/product_action", json=obj).expect(code=200, status='created').data
        return self.action


class ApiTest(TestCaseBase):
    api = None
    
    @classmethod
    def setUpClass(self):
        super().setUpClass()
        self.api = ApiFactory(obj_factory=self.obj, base_url=self.api_url)

    def request(self, *args, **kwargs):
        return self.api.request(*args, **kwargs)

    def post(self, *args, **kwargs):
        return self.api.post(*args, **kwargs)

    def put(self, *args, **kwargs):
        return self.api.put(*args, **kwargs)

    def delete(self, *args, **kwargs):
        return self.api.delete(*args, **kwargs)

    def get(self, *args, **kwargs):
        return self.api.get(*args, **kwargs)
