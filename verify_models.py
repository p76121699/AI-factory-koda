import sys
import os

# Add project root to path
sys.path.append(os.getcwd())

try:
    from simulation.models import Machine, Cutter
    print("Successfully imported simulation.models")

    m = Machine(id="test", name="Test", type="Cutter")
    print(f"Machine created: {m}")
    
    m.update(0.1)
    print("Machine updated")
    
    data = m.to_dict()
    print(f"Machine dict: {data}")
    
    c = Cutter(id="cutter1", name="Cutter 1", type="Cutter")
    c.update(0.1)
    print(f"Cutter dict: {c.to_dict()}")
    
    print("All checks passed")

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
