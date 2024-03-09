class Item:
    def __init__(self, weight, value):
        self.weight = weight
        self.value = value

def branch_and_bound_knapsack(items, capacity):
    # Sort items in descending order of value-to-weight ratio
    items.sort(key=lambda x: x.value / x.weight, reverse=True)

    # Initialize variables
    n = len(items)
    best_value = 0
    best_solution = [0] * n

    def calculate_upper_bound(level, curr_weight, curr_value):
        # Initialize upper bound with the current value
        upper_bound = curr_value

        # Calculate upper bound using the given formula
        for i in range(level, n):
            if curr_weight + items[i].weight <= capacity:
                curr_weight += items[i].weight
                upper_bound += items[i].value
            else:
                remaining_capacity = capacity - curr_weight
                upper_bound += (remaining_capacity * items[i].value / items[i].weight)
                break
        print(upper_bound)

        return upper_bound

    def backtrack(level, curr_weight, curr_value):
        nonlocal best_value, best_solution

        if curr_weight <= capacity and curr_value > best_value:
            best_value = curr_value
            best_solution = [0] * n
            for i in range(n):
                best_solution[i] = 1 if selected_items[i] else 0

        if level < n and calculate_upper_bound(level, curr_weight, curr_value) > best_value:
            # Explore the left child node (with the current item included)
            selected_items[level] = 1
            backtrack(level + 1, curr_weight + items[level].weight, curr_value + items[level].value)

            # Explore the right child node (with the current item excluded)
            selected_items[level] = 0
            backtrack(level + 1, curr_weight, curr_value)

    selected_items = [0] * n
    backtrack(0, 0, 0)

    return best_value, best_solution

# Example usage
items = [
    Item(2, 12),
    Item(1, 10),
    Item(3, 20),
    Item(2, 15)
]
capacity = 10

best_value, best_solution = branch_and_bound_knapsack(items, capacity)
print("Best value:", best_value)
print("Best solution:", best_solution)
