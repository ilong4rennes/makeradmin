from flask import render_template
import service
from service import eprint
import json
from webshop_entities import category_entity, product_entity, transaction_entity, transaction_content_entity, \
    action_entity, product_image_entity
from typing import List, Dict, Any, Tuple
from decimal import Decimal
from filters import product_filters


instance = service.create_frontend("shop", url="shop", port=None)

# Grab the database so that we can use it inside requests
db = instance.db

product_entity.db = db
category_entity.db = db
transaction_entity.db = db
transaction_content_entity.db = db
action_entity.db = db
product_image_entity.db = db


def product_data() -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    with db.cursor() as cur:
        # Get all categories, as some products may exist in deleted categories
        # (it is up to an admin to move them to another category)
        categories: List[Dict[str,Any]] = category_entity.list(where=None)

        data = []
        for cat in categories:
            cur.execute("SELECT id,name,unit,price,smallest_multiple FROM webshop_products"
                        " WHERE category_id=%s AND deleted_at IS NULL ORDER BY name", (cat["id"],))
            products = cur.fetchall()
            if len(products) > 0:
                data.append({
                    "id": cat["id"],
                    "name": cat["name"],
                    "items": [
                        {
                            "id": item[0],
                            "name": item[1],
                            "unit": item[2],
                            "price": str(item[3]),
                            "smallest_multiple": item[4],
                        } for item in products
                    ]
                })

        # Only show existing columns in the sidebar
        categories = category_entity.list()
        return data, categories


@instance.route("/")
def home() -> str:
    return render_template("shop.html")


@instance.route("cart")
def cart() -> str:
    all_products, categories = product_data()
    return render_template("cart.html", product_json=json.dumps(all_products), categories=categories,
                           url=instance.full_path)


@instance.route("register")
def register_member() -> str:
    return render_template("register.html")


@instance.route("member/history")
def purchase_history() -> str:
    return render_template("history.html", url=instance.full_path)


@instance.route("product/<int:id>")
def product_view(id: int) -> str:
    product = product_entity.get(id)
    images = product_image_entity.list("product_id=%s AND deleted_at IS NULL", product["id"])
    all_products, categories = product_data()
    return render_template(
        "product.html", product=product, images=images, product_json=json.dumps(all_products), Decimal=Decimal, categories=categories, currency="kr", url=instance.full_path
    )


@instance.route("product/<int:id>/edit")
def product_edit(id: int) -> str:
    categories = category_entity.list()
    product = product_entity.get(id)
    images = product_image_entity.list("product_id=%s AND deleted_at IS NULL", product["id"])

    # Find the ids and names of all actions that this product has
    with db.cursor() as cur:
        cur.execute("SELECT webshop_product_actions.id,webshop_actions.id,webshop_actions.name,webshop_product_actions.value"
                    " FROM webshop_product_actions"
                    " INNER JOIN webshop_actions ON webshop_product_actions.action_id=webshop_actions.id"
                    " WHERE webshop_product_actions.product_id=%s AND webshop_product_actions.deleted_at IS NULL", id)
        actions = cur.fetchall()
        eprint(actions)
        actions = [{
            "id": a[0],
            "action_id": a[1],
            "name": a[2],
            "value": a[3],
        } for a in actions]

    action_categories = action_entity.list()
    action_json = json.dumps({
        "actions": actions,
        "action_categories": action_categories,
        "images": images
    })

    filters = sorted(product_filters.keys())

    return render_template("product_edit.html", action_json=action_json,
                           filters=filters, action_categories=action_categories,
                           product=product, categories=categories, url=instance.full_path)


@instance.route("product/create")
def product_create() -> str:
    categories = category_entity.list()

    product = {
        "category_id": "",
        "name": "",
        "description": "",
        "unit": "",
        "price": 0.0,
        "id": "new",
        "smallest_multiple": 1,
    }

    action_categories = action_entity.list()
    action_json = json.dumps({
        "actions": [],
        "action_categories": action_categories
    })

    return render_template("product_edit.html", action_json=action_json, action_categories=action_categories, product=product, categories=categories, url=instance.full_path)


@instance.route("receipt/<int:id>")
def receipt(id: int) -> str:
    transaction = transaction_entity.get(id)
    items = transaction_content_entity.list("transaction_id=%s", id)
    products = [product_entity.get(item["product_id"]) for item in items]
    r = instance.gateway.get(f"membership/member/{transaction['member_id']}")
    assert r.ok
    member = r.json()["data"]

    return render_template("receipt.html", cart=zip(products,items), transaction=transaction, currency="kr", member=member, url=instance.full_path)


@instance.route("statistics")
def statistics() -> str:
    return render_template("statistics.html", url=instance.full_path)


instance.serve_indefinitely()
